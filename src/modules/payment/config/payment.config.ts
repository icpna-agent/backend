import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ItemsInfo, PayerInfo, PaymentOptionsInfo } from "../payment.service";

export interface Preferences {
    items: (never | ItemsInfo)[];
    external_reference: string;
    payer: PayerInfo;
    payment_methods: PaymentOptionsInfo;
    back_urls: {
        success: string;
        failure: string;
        pending: string;
    };
    notification_url: string;
    auto_return: string;
}

@Injectable()
export class PaymentConfig {
    private readonly successPath: string;
    private readonly failurePath: string;
    private readonly pendingPath: string;

    constructor(private readonly config: ConfigService) {
        this.successPath = this.config.get('LANDING_MP_SUCCESS_PATH') ?? 'success';
        this.pendingPath = this.config.get('LANDING_MP_PENDING_PATH') ?? 'pending';
        this.failurePath = this.config.get('LANDING_MP_FAILURE_PATH') ?? 'failure';
    }

    get mpAccessToken(): string {
        return this.config.get('NODE_ENV') === 'production'
            ? this.config.getOrThrow<string>('MP_ACCESS_TOKEN_PROD')
            : this.config.getOrThrow<string>('MP_ACCESS_TOKEN_TEST');
    }

    get mercadoPagoUrl(): string {
        return 'https://api.mercadopago.com/checkout/preferences';
    }

    get mercadoPagoPaymentStatusUrl(): string {
        return 'https://api.mercadopago.com/v1/payments';
    }

    get webhookSecret(): string {
        return this.config.getOrThrow<string>('MP_WEBHOOK_SECRET');
    }

    generateMercadoPagoPreferences(items: ItemsInfo[], payer: PayerInfo, userId: number): Preferences {
        const landing = this.config.get('LANDING_PAGE') as string | null | undefined ?? 'http://localhost:3000';

        return {
            items,
            external_reference: `user-${userId}`,
            payer,
            payment_methods: {
                excluded_payment_methods: [],
                excluded_payment_types: [],
                installments: 1,
                default_installments: 1,
            },
            back_urls: {
                success: `${landing}/${this.successPath}`,
                failure: `${landing}/${this.failurePath}`,
                pending: `${landing}/${this.pendingPath}`,
            },
            notification_url: `${process.env.ITSELF ?? 'http://localhost:8080'}/payment/get-notifs-from-mp`,
            auto_return: 'approved',
        };
    }
}