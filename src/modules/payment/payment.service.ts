import { BadRequestException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { PaymentRepository } from './payment.repository';
import { PaymentDto } from './dto/payment.dto';
import { SubscriptionStatusDto } from './dto/subscription.status.dto';
import { ApiReturn } from '@/core/types/core.types';
import { PaymentConfig } from './config/payment.config';
import crypto from "node:crypto";

export interface ItemsInfo {
    id: string;
    title: string;
    description: string;
    picture_url: string | null;
    category_id: string;
    quantity: number;
    currency_id: string;
    unit_price: number;
};

export interface PayerInfo {
    name: string;
    surname: string;
    email: string;
    phone: {
        area_code: string;
        number: string;
    };
    address: {
        zip_code: string;
        street_name: string;
        street_number?: string;
    };
};

export interface PaymentOptionsInfo {
    excluded_payment_methods: (never | { id: string })[];
    excluded_payment_types: (never | { id: string })[];
    installments: number;
    default_installments: number;
};


@Injectable()
export class PaymentService {
    private readonly mercadoPagoToken: string;

    constructor(
        private readonly repo: PaymentRepository,
        private readonly config: PaymentConfig,
    )
    {
        this.mercadoPagoToken = this.config.mpAccessToken;
    }

    async makePayment(paymentDto: PaymentDto, userId: number): Promise<ApiReturn<{ mpLink: string} | { message: string } | null>> {
        /*return {
            error: false,
            body: { mpLink: `https://payment.example.com/pay?amount=${paymentDto.price}&currency=${paymentDto.unit}` },
        };*/
        const { 
            item: {
                name,
                price,
                unit,
                img
            },
            payer,
        } = paymentDto;
        const url = this.config.mercadoPagoUrl;

        const items: ItemsInfo[] = [
            {
                id: "12",
                title: name,
                description: "Una suscripción al agente de ICPNA por un mes",
                picture_url: null,
                category_id: "1",
                quantity: unit,
                currency_id: "PEN",
                unit_price: price,
            },
        ];

        const preferences = this.config.generateMercadoPagoPreferences(items, payer, userId);

        try {
            const request = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.mercadoPagoToken}`,
                },
                body: JSON.stringify(preferences),
            });

            if (!request.ok)
                throw new InternalServerErrorException('No se pudo concretar el pago');

            return {
                error: false,
                body: {
                    mpLink: ((await request.json()) as { init_point: string }).init_point,
                },
            };
        } catch (error: unknown) {
            console.error(error);
            return {
                error: true,
                body: {
                    message: 'No se pudo ejecutar el pago...',
                },
            };
        }
    }

    async getSubscriptionStatus(userId: number): Promise<ApiReturn<SubscriptionStatusDto | null>> {
        const activeSub = await this.repo.getActiveSubscription(userId);

        if (!activeSub) {
            return {
                error: false,
                body: {
                    status: 'inactive',
                    plan: 'none',
                    expiryDate: '',
                    isActive: false,
                },
            };
        }

        const now = new Date();
        const isActive = activeSub.status === 'active' && activeSub.expires_at > now;

        return {
            error: false,
            body: {
                status: isActive ? 'active' : 'expired',
                plan: 'basic',
                expiryDate: activeSub.expires_at.toISOString(),
                isActive,
            },
        };
    }

    async reactAgainstMpNotif(request: ExpressRequest, response: ExpressResponse): Promise<void> {
        interface MercadoPagoWebhookRequest {
            id: number;
            live_mode: boolean;
            type: string;
            date_created: string;
            user_id: number;
            api_version: string;
            action: string;
            data?: {
                id?: string;
            }
        }

        const { headers, body: rawBody } = request;

        this.validateInput(rawBody);
        const body = rawBody as MercadoPagoWebhookRequest;

        const xSignature = headers['x-signature'];
        if (xSignature == null) {
            throw new BadRequestException();
        }

        const xRequestId = headers['x-request-id'];
        const requestId = Array.isArray(xRequestId) ? xRequestId[0] : xRequestId;

        // Check for idempotency: if we've already processed this webhook, return OK
        if (requestId) {
            const existingPayment = await this.repo.getPaymentByRequestId(requestId);
            if (existingPayment) {
                response.status(HttpStatus.OK).send();
                return;
            }
        }

        const signatureValue = Array.isArray(xSignature) ? xSignature[0] : xSignature;
        const [, timestamp, , signature ] = signatureValue.split(',').flatMap((str: string) => str.split('='));

        const templateParts: string[] = [];
        if (body.data?.id != null) {
            templateParts.push(`id:${body.data.id.toLowerCase()}`);
        }
        if (requestId != null) {
            templateParts.push(`request-id:${requestId}`);
        }
        templateParts.push(`ts:${timestamp}`);

        const manifest = templateParts.join(';');
        
        const cyphedManifest = crypto
            .createHmac('sha256', this.config.webhookSecret)
            .update(manifest)
            .digest('hex');

        if (cyphedManifest !== signature)
            throw new BadRequestException();

        // Extract user ID and payment ID from the webhook
        const mpPaymentId = body.data?.id;
        if (!mpPaymentId) {
            throw new BadRequestException('Missing payment ID in webhook data');
        }

        // Fetch payment details from Mercado Pago
        const paymentDetails = await this.fetchMercadoPagoPaymentDetails(mpPaymentId);
        if (!paymentDetails) {
            throw new BadRequestException('Could not fetch payment details from Mercado Pago');
        }

        const { status: paymentStatus, external_reference, transaction_amount } = paymentDetails;
        
        // Extract user ID from external_reference (format: "user-123")
        const userIdMatch = external_reference?.match(/^user-(\d+)$/);
        if (!userIdMatch) {
            throw new BadRequestException('Invalid external_reference format');
        }
        const userId = parseInt(userIdMatch[1], 10);

        // Create payment record
        const dbPayment = await this.repo.createPayment({
            user_id: userId,
            mp_payment_id: mpPaymentId,
            mp_request_id: requestId,
            amount: transaction_amount.toString(),
            currency: 'PEN',
            status: paymentStatus,
        });

        // If payment is approved, update or create subscription
        if (paymentStatus === 'approved') {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30); // 30-day subscription

            await this.repo.createSubscription({
                user_id: userId,
                status: 'active',
                expires_at: expiryDate,
            });
        }

        response.status(HttpStatus.OK).send();
    }

    private async fetchMercadoPagoPaymentDetails(
        paymentId: string,
    ): Promise<{
        status: string;
        external_reference: string | null;
        transaction_amount: number;
    } | null> {
        try {
            const url = `${this.config.mercadoPagoPaymentStatusUrl}/${paymentId}`;
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.mercadoPagoToken}`,
                },
            });

            if (!response.ok) return null;

            const data = (await response.json()) as any;
            return {
                status: data.status,
                external_reference: data.external_reference,
                transaction_amount: data.transaction_amount,
            };
        } catch (error) {
            console.error('Error fetching payment details from Mercado Pago:', error);
            return null;
        }
    }


    private validateInput(body: unknown) {
        if (body == null || typeof body !== 'object' || Array.isArray(body)) {
            throw new BadRequestException();
        }

        const rec = body as Record<string, unknown>;

        const requiredFields: Array<[string, (value: unknown) => boolean]> = [
            ['id', (value) => typeof value === 'number'],
            ['live_mode', (value) => typeof value === 'boolean'],
            ['type', (value) => typeof value === 'string'],
            ['date_created', (value) => typeof value === 'string'],
            ['user_id', (value) => typeof value === 'number'],
            ['api_version', (value) => typeof value === 'string'],
            ['action', (value) => typeof value === 'string'],
            ['data', (value) => this.isPlainObject(value)],
        ];

        for (const [fieldName, validator] of requiredFields) {
            const value = rec[fieldName];
            if (value == null || !validator(value)) {
                throw new BadRequestException();
            }
        }

        const data = rec.data as Record<string, unknown>;
        if (data?.id == null)
            return;

        if (typeof data!.id !== 'string') {
            throw new BadRequestException();
        }
    }

    private isPlainObject(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value != null && !Array.isArray(value);
    }
}
