import { BadGatewayException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { PaymentDto } from './dto/payment.dto';
import { SubscriptionStatusDto } from './dto/subscription.status.dto';
import { ApiReturn } from '@/core/types/core.types';

type MercadoPagoPreferenceResponse = {
    id?: string;
    init_point?: string;
    sandbox_init_point?: string;
    message?: string;
    error?: string;
    cause?: unknown;
};

type MercadoPagoPaymentResponse = {
    id?: number | string;
    status?: string;
    external_reference?: string;
    payer?: {
        phone?: {
            number?: string;
        };
    };
};

@Injectable()
export class PaymentService {
    constructor(private readonly repo: PaymentRepository) {}

    async makePayment(paymentDto: PaymentDto): Promise<ApiReturn<{ mpLink: string; preferenceId?: string } | null>> {
        const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

        if (!accessToken) {
            throw new InternalServerErrorException('MERCADO_PAGO_ACCESS_TOKEN is not configured');
        }

        const frontendUrl = this.normalizeUrl(process.env.FRONTEND_URL ?? 'http://localhost:5173');
        const unitPrice = Number(paymentDto.price || 5);
        const currency = paymentDto.unit || 'PEN';

        const preferencePayload = {
            items: [
                {
                    id: 'icpna-assistant-monthly',
                    title: paymentDto.name || 'ICPNA Assistant - Suscripción mensual',
                    description: 'Pago de suscripción mensual de ICPNA Assistant',
                    picture_url: paymentDto.img || undefined,
                    quantity: 1,
                    currency_id: currency,
                    unit_price: unitPrice,
                },
            ],
            payer: {
                name: paymentDto.user || undefined,
                email: paymentDto.mail || undefined,
                phone: paymentDto.phone ? { number: paymentDto.phone } : undefined,
            },
            back_urls: {
                success: `${frontendUrl}/success`,
                failure: `${frontendUrl}/auth?payment=failure`,
                pending: `${frontendUrl}/auth?payment=pending`,
            },
            auto_return: 'approved',
            external_reference: paymentDto.phone || paymentDto.mail || undefined,
            notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL || undefined,
            statement_descriptor: 'ICPNA ASSIST',
        };

        const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(preferencePayload),
        });

        const preference = (await response.json()) as MercadoPagoPreferenceResponse;

        if (!response.ok) {
            throw new BadGatewayException({
                message: 'Mercado Pago rejected the payment preference',
                status: response.status,
                mercadoPago: preference,
            });
        }

        const useSandboxLink = process.env.MERCADO_PAGO_USE_SANDBOX_LINK === 'true';
        const mpLink = (useSandboxLink ? preference.sandbox_init_point : preference.init_point) || preference.init_point || preference.sandbox_init_point;

        if (!mpLink) {
            throw new BadGatewayException('Mercado Pago did not return a checkout URL');
        }

        return {
            error: false,
            body: {
                mpLink,
                preferenceId: preference.id,
            },
        };
    }

    async getSubscriptionStatus(): Promise<ApiReturn<SubscriptionStatusDto | null>> {
        return {
            error: false,
            body: {
                status: 'active',
                plan: 'basic',
                expiryDate: '2026-12-31T23:59:59Z',
                isActive: true,
            },
        };
    }

    async handleMercadoPagoWebhook(body: unknown, query: Record<string, unknown> = {}): Promise<ApiReturn<{ received: boolean; paymentStatus?: string; engineResult?: unknown; message?: string }>> {
        const paymentId = this.extractPaymentId(body, query);

        if (!paymentId) {
            return {
                error: false,
                body: {
                    received: true,
                    message: 'Webhook received, but no Mercado Pago payment id was found.',
                },
            };
        }

        const payment = await this.getMercadoPagoPayment(paymentId);

        if (payment.status !== 'approved') {
            return {
                error: false,
                body: {
                    received: true,
                    paymentStatus: payment.status,
                    message: 'Payment is not approved yet. Engine user was not enabled.',
                },
            };
        }

        const phone = this.normalizePhone(payment.external_reference || payment.payer?.phone?.number);
        const engineResult = await this.enableUserInEngine(phone);

        return {
            error: false,
            body: {
                received: true,
                paymentStatus: payment.status,
                engineResult,
            },
        };
    }

    async reactAgainstMpNotif() {

    }

    private normalizeUrl(url: string): string {
        return url.replace(/\/+$/, '');
    }

    private extractPaymentId(body: unknown, query: Record<string, unknown>): string | null {
        const bodyRecord = body as Record<string, any>;
        const queryId = query.id || query['data.id'];
        const bodyId = bodyRecord?.data?.id || bodyRecord?.id || bodyRecord?.resource;

        const rawPaymentId = queryId || bodyId;
        if (!rawPaymentId) return null;

        const paymentId = String(rawPaymentId).split('/').pop();
        return paymentId || null;
    }

    private async getMercadoPagoPayment(paymentId: string): Promise<MercadoPagoPaymentResponse> {
        const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

        if (!accessToken) {
            throw new InternalServerErrorException('MERCADO_PAGO_ACCESS_TOKEN is not configured');
        }

        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        const payment = (await response.json()) as MercadoPagoPaymentResponse;

        if (!response.ok) {
            throw new BadGatewayException({
                message: 'Mercado Pago payment lookup failed',
                status: response.status,
                mercadoPago: payment,
            });
        }

        return payment;
    }

    private async enableUserInEngine(phone?: string): Promise<unknown> {
        const engineUserEnableUrl = process.env.ENGINE_USER_ENABLE_URL;

        if (!engineUserEnableUrl) {
            return {
                enabled: false,
                reason: 'ENGINE_USER_ENABLE_URL is not configured',
            };
        }

        if (!phone) {
            return {
                enabled: false,
                reason: 'Payment does not include a phone/external_reference to enable',
            };
        }

        const response = await fetch(engineUserEnableUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone }),
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
            throw new BadGatewayException({
                message: 'Engine user enable request failed',
                status: response.status,
                engine: result,
            });
        }

        return result;
    }

    private normalizePhone(value?: string): string | undefined {
        if (!value) return undefined;
        return value.replace(/[^\d]/g, '');
    }
}
