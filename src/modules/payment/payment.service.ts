import { ApiReturn } from '@core/types/core.types';
import { PaymentProviderResponse } from '@db/tables/payment-transaction.table';
import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  PaymentHistoryItemDto,
  SubscriptionStatusDto,
} from './dto/subscription.status.dto';
import { PaymentRepository } from '@repositories/payment.repository';

type MercadoPagoPreferenceResponse = {
  id?: string;
  init_point?: string;
  sandbox_init_point?: string;
  message?: string;
  error?: string;
  cause?: unknown;
};

type MercadoPagoPaymentResponse = PaymentProviderResponse & {
  id?: number | string;
  status?: string;
  status_detail?: string;
  external_reference?: string;
  date_approved?: string;
  transaction_amount?: number;
  currency_id?: string;
};

type MercadoPagoPaymentSearchResponse = {
  results?: MercadoPagoPaymentResponse[];
};

type MercadoPagoPreferencePayload = PaymentProviderResponse & {
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
};

type PaymentProcessingResult = {
  received: boolean;
  paymentStatus?: string;
  subscriptionActive?: boolean;
  engineResult?: unknown;
  message?: string;
};

type EngineEnableResult = {
  enabled: boolean;
  response?: unknown;
  reason?: string;
};

@Injectable()
export class PaymentService {
  private readonly planPrice = Number(process.env.SUBSCRIPTION_PRICE_PEN ?? 5);
  private readonly planId = process.env.SUBSCRIPTION_PLAN_ID ?? 'basic';
  private readonly planName = process.env.SUBSCRIPTION_PLAN_NAME ?? 'Basic';

  constructor(private readonly repo: PaymentRepository) {}

  async makePayment(
    userId: number,
  ): Promise<
    ApiReturn<{ mpLink: string; preferenceId?: string; transactionId: number }>
  > {
    const accessToken = this.getAccessToken();
    const user = await this.repo.findUserById(userId);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const frontendUrl = this.normalizeUrl(
      process.env.LANDING_URL ?? 'http://localhost:5173',
    );
    const reusable = await this.repo.findReusablePending(
      userId,
      new Date(Date.now() - 30 * 60 * 1000),
    );
    if (reusable?.checkoutUrl && this.canReuseCheckout(reusable, frontendUrl)) {
      return {
        error: false,
        body: {
          mpLink: reusable.checkoutUrl,
          preferenceId: reusable.providerPreferenceId ?? undefined,
          transactionId: reusable.id,
        },
      };
    }

    const externalReference = this.buildExternalReference(userId);
    const payment = await this.repo.createPayment({
      userId,
      externalReference,
      status: 'pending',
      amount: this.planPrice.toFixed(2),
      currency: this.getCurrency(),
    });

    const returnSettings = frontendUrl.startsWith('https://')
      ? {
          back_urls: {
            success: `${frontendUrl}/success`,
            failure: `${frontendUrl}/success?result=failure`,
            pending: `${frontendUrl}/success?result=pending`,
          },
          auto_return: 'approved',
        }
      : {};
    const preferencePayload: MercadoPagoPreferencePayload = {
      items: [
        {
          id: externalReference,
          title: `Suscripción Plan ${this.planName} - ICPNA Studio`,
          description: 'Pago de suscripción mensual de ICPNA Assistant',
          quantity: 1,
          currency_id: this.getCurrency(),
          unit_price: this.planPrice,
        },
      ],
      payer: {
        name: user.username,
        email: user.mail,
        phone: { number: user.phone },
      },
      ...returnSettings,
      external_reference: externalReference,
      notification_url: this.getWebhookUrl(externalReference),
      metadata: {
        external_reference: externalReference,
        user_id: userId,
        plan_id: this.planId,
        transaction_id: payment.id,
      },
      statement_descriptor: 'ICPNA ASSIST',
    };

    const response = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferencePayload),
      },
    );
    const preference = (await response.json()) as MercadoPagoPreferenceResponse;

    if (!response.ok) {
      await this.repo.updatePayment(payment.id, {
        status: 'failed',
        statusDetail:
          preference.message ??
          preference.error ??
          'preference_creation_failed',
        rawProviderResponse: this.buildPreferenceProviderResponse(
          preference,
          preferencePayload,
        ),
      });
      throw new BadGatewayException({
        message: 'Mercado Pago rejected the payment preference',
        status: response.status,
        mercadoPago: preference,
      });
    }

    const mpLink = this.getCheckoutUrl(preference);
    if (!mpLink) {
      await this.repo.updatePayment(payment.id, {
        status: 'failed',
        statusDetail: 'missing_checkout_url',
        rawProviderResponse: this.buildPreferenceProviderResponse(
          preference,
          preferencePayload,
        ),
      });
      throw new BadGatewayException(
        'Mercado Pago did not return a checkout URL',
      );
    }

    await this.repo.updatePayment(payment.id, {
      providerPreferenceId: preference.id ?? null,
      checkoutUrl: mpLink,
      rawProviderResponse: this.buildPreferenceProviderResponse(
        preference,
        preferencePayload,
      ),
    });

    return {
      error: false,
      body: { mpLink, preferenceId: preference.id, transactionId: payment.id },
    };
  }

  async getSubscriptionStatus(
    userId: number,
  ): Promise<ApiReturn<SubscriptionStatusDto>> {
    await this.reconcilePendingPayment(userId).catch(() => undefined);
    const current = await this.repo.findSubscription(userId);
    if (!current) {
      return {
        error: false,
        body: {
          status: 'inactive',
          plan: 'basic',
          expiryDate: null,
          isActive: false,
        },
      };
    }

    const isExpired =
      !current.expiresAt || current.expiresAt.getTime() <= Date.now();
    if (current.status === 'active' && isExpired) {
      await this.repo.markSubscriptionExpired(userId);
    }
    const isActive = current.status === 'active' && !isExpired;

    return {
      error: false,
      body: {
        status: isActive ? 'active' : isExpired ? 'expired' : current.status,
        plan: current.plan,
        expiryDate: current.expiresAt?.toISOString() ?? null,
        isActive,
      },
    };
  }

  async getPaymentHistory(
    userId: number,
  ): Promise<ApiReturn<PaymentHistoryItemDto[]>> {
    const history = await this.repo.findPaymentHistory(userId);
    return { error: false, body: history };
  }

  async syncPayment(
    userId: number,
    paymentId: string,
  ): Promise<ApiReturn<PaymentProcessingResult>> {
    const payment = await this.getMercadoPagoPayment(paymentId);
    const result = await this.processProviderPayment(payment, userId);
    return { error: false, body: result };
  }

  async handleMercadoPagoWebhook(
    body: unknown,
    query: Record<string, unknown> = {},
  ): Promise<ApiReturn<PaymentProcessingResult>> {
    const paymentId = this.extractPaymentId(body, query);
    const externalReference = this.extractExternalReference(query);
    if (!paymentId) {
      return {
        error: false,
        body: {
          received: true,
          message: 'Webhook received without a Mercado Pago payment id.',
        },
      };
    }

    const payment = await this.getMercadoPagoPayment(paymentId);
    const result = await this.processProviderPayment(
      payment,
      undefined,
      externalReference,
    );
    return { error: false, body: result };
  }

  private async processProviderPayment(
    providerPayment: MercadoPagoPaymentResponse,
    expectedUserId?: number,
    fallbackExternalReference?: string,
  ): Promise<PaymentProcessingResult> {
    const externalReference =
      providerPayment.external_reference ?? fallbackExternalReference;
    if (!externalReference) {
      throw new BadRequestException(
        'Mercado Pago payment does not include an external reference',
      );
    }

    const payment = await this.repo.findByExternalReference(externalReference);
    if (!payment)
      throw new NotFoundException('La transacción no pertenece a este sistema');
    if (expectedUserId !== undefined && payment.userId !== expectedUserId) {
      throw new UnauthorizedException(
        'El pago no pertenece al usuario autenticado',
      );
    }

    this.assertPaymentAmount(payment.amount, payment.currency, providerPayment);
    const providerPaymentId = String(providerPayment.id ?? '');
    const status = this.mapPaymentStatus(providerPayment.status);
    const rawProviderResponse = this.toProviderResponse(providerPayment);

    if (status !== 'approved') {
      await this.repo.updatePayment(payment.id, {
        providerPaymentId: providerPaymentId || null,
        status,
        statusDetail: providerPayment.status_detail ?? null,
        rawProviderResponse,
      });
      return {
        received: true,
        paymentStatus: status,
        subscriptionActive: false,
      };
    }

    if (!providerPaymentId)
      throw new BadRequestException('Mercado Pago payment id is missing');
    const currentSubscription = await this.repo.findSubscription(
      payment.userId,
    );
    const paidAt = providerPayment.date_approved
      ? new Date(providerPayment.date_approved)
      : new Date();
    const baseDate =
      currentSubscription?.status === 'active' &&
      currentSubscription.expiresAt &&
      currentSubscription.expiresAt > paidAt
        ? currentSubscription.expiresAt
        : paidAt;
    const expiresAt = new Date(baseDate);
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    await this.repo.approveAndActivate(payment.id, {
      providerPaymentId,
      statusDetail: providerPayment.status_detail ?? null,
      rawProviderResponse,
      paidAt,
      startsAt: paidAt,
      expiresAt,
    });

    let engineResult: EngineEnableResult | undefined;
    if (!payment.engineEnabledAt) {
      const user = await this.repo.findUserById(payment.userId);
      try {
        engineResult = await this.enableUserInEngine(user?.phone);
        const engineUpdate = engineResult.enabled
          ? { engineEnabledAt: new Date(), engineError: null }
          : {
              engineError: engineResult.reason ?? 'Engine user was not enabled',
            };
        await this.repo.updatePayment(payment.id, engineUpdate);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        await this.repo.updatePayment(payment.id, { engineError: message });
        throw error;
      }
    }

    return {
      received: true,
      paymentStatus: 'approved',
      subscriptionActive: true,
      engineResult,
    };
  }

  private async reconcilePendingPayment(userId: number): Promise<void> {
    const pending = await this.repo.findReusablePending(
      userId,
      new Date(Date.now() - 24 * 60 * 60 * 1000),
    );
    if (!pending) return;

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(pending.externalReference)}&sort=date_created&criteria=desc`,
      { headers: { Authorization: `Bearer ${this.getAccessToken()}` } },
    );
    if (!response.ok) return;

    const search = (await response.json()) as MercadoPagoPaymentSearchResponse;
    const providerPayment = search.results?.[0];
    if (providerPayment) {
      await this.processProviderPayment(providerPayment, userId);
    }
  }

  private assertPaymentAmount(
    expectedAmount: string,
    expectedCurrency: string,
    providerPayment: MercadoPagoPaymentResponse,
  ) {
    if (
      Number(providerPayment.transaction_amount) !== Number(expectedAmount) ||
      providerPayment.currency_id !== expectedCurrency
    ) {
      throw new BadRequestException(
        'El monto o la moneda del pago no coincide con la transacción',
      );
    }
  }

  private normalizeUrl(url: string): string {
    return url.replace(/\/+$/, '');
  }

  private extractPaymentId(
    body: unknown,
    query: Record<string, unknown>,
  ): string | null {
    const bodyRecord = this.toProviderResponse(body);
    const data =
      typeof bodyRecord.data === 'object' && bodyRecord.data !== null
        ? (bodyRecord.data as Record<string, unknown>)
        : undefined;
    const queryId = query.id || query['data.id'];
    const bodyId = data?.id || bodyRecord.id || bodyRecord.resource;
    const rawPaymentId = queryId || bodyId;
    if (typeof rawPaymentId !== 'string' && typeof rawPaymentId !== 'number') {
      return null;
    }

    const paymentId = String(rawPaymentId).split('/').pop();
    return paymentId || null;
  }

  private async getMercadoPagoPayment(
    paymentId: string,
  ): Promise<MercadoPagoPaymentResponse> {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: { Authorization: `Bearer ${this.getAccessToken()}` },
      },
    );
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

  private async enableUserInEngine(
    phone?: string,
  ): Promise<EngineEnableResult> {
    const engineUserEnableUrl = this.getEngineUserEnableUrl();
    if (!engineUserEnableUrl) {
      return {
        enabled: false,
        reason: 'ENGINE_HOST is not configured',
      };
    }
    if (!phone)
      throw new BadRequestException(
        'El usuario no tiene un teléfono para habilitar',
      );

    const response = await fetch(engineUserEnableUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: this.normalizePhone(phone) }),
    });
    const result = (await response
      .json()
      .catch((): unknown => null)) as unknown;
    if (!response.ok) {
      throw new BadGatewayException({
        message: 'Engine user enable request failed',
        status: response.status,
        engine: result,
      });
    }
    return { enabled: true, response: result };
  }

  private getEngineUserEnableUrl(): string | undefined {
    const engineHost = process.env.ENGINE_HOST;
    if (!engineHost) return undefined;

    return `${this.normalizeUrl(engineHost)}/external/access/user`;
  }

  private normalizePhone(value: string): string {
    return value.replace(/[^\d]/g, '');
  }

  private mapPaymentStatus(status?: string) {
    if (status === 'approved') return 'approved' as const;
    if (status === 'cancelled') return 'cancelled' as const;
    if (status === 'refunded') return 'refunded' as const;
    if (status === 'rejected') return 'rejected' as const;
    return 'pending' as const;
  }

  private canReuseCheckoutUrl(checkoutUrl: string): boolean {
    if (this.shouldUseSandboxLink()) return true;
    return !checkoutUrl.includes('sandbox.mercadopago');
  }

  private canReuseCheckout(
    checkout: {
      checkoutUrl: string | null;
      rawProviderResponse?: PaymentProviderResponse | null;
    },
    frontendUrl: string,
  ): boolean {
    if (!checkout.checkoutUrl) return false;
    if (!this.canReuseCheckoutUrl(checkout.checkoutUrl)) return false;

    const preferenceRequest = checkout.rawProviderResponse?.preferenceRequest;
    if (typeof preferenceRequest !== 'object' || preferenceRequest === null) {
      return false;
    }

    const backUrls = (preferenceRequest as MercadoPagoPreferencePayload)
      .back_urls;
    return backUrls?.success === `${frontendUrl}/success`;
  }

  private getCheckoutUrl(preference: MercadoPagoPreferenceResponse) {
    if (this.shouldUseSandboxLink()) {
      return (
        preference.sandbox_init_point ??
        preference.init_point ??
        preference.sandbox_init_point
      );
    }

    return (
      preference.init_point ??
      preference.sandbox_init_point ??
      preference.init_point
    );
  }

  private shouldUseSandboxLink() {
    return process.env.MERCADO_PAGO_USE_SANDBOX_LINK === 'true';
  }

  private buildExternalReference(userId: number): string {
    return `subscription:${userId}:${this.planId}:${Date.now()}`;
  }

  private extractExternalReference(query: Record<string, unknown>) {
    const value = query.externalReference ?? query.external_reference;
    if (typeof value !== 'string') return undefined;
    return value.trim() || undefined;
  }

  private getCurrency() {
    return process.env.MERCADO_PAGO_CURRENCY ?? 'PEN';
  }

  private getWebhookUrl(externalReference?: string) {
    const explicit = process.env.MERCADO_PAGO_WEBHOOK_URL;
    const baseUrl = explicit || this.getDefaultWebhookUrl();
    if (!baseUrl || !externalReference) return baseUrl;

    try {
      const url = new URL(baseUrl);
      url.searchParams.set('externalReference', externalReference);
      return url.toString();
    } catch {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}externalReference=${encodeURIComponent(externalReference)}`;
    }
  }

  private getDefaultWebhookUrl() {
    const backendUrl = process.env.BACKEND_URL || process.env.API_URL;
    return backendUrl
      ? `${this.normalizeUrl(backendUrl)}/payment/webhook`
      : undefined;
  }

  private getAccessToken(): string {
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      throw new InternalServerErrorException(
        'MERCADO_PAGO_ACCESS_TOKEN is not configured',
      );
    }
    return accessToken;
  }

  private toProviderResponse(value: unknown): PaymentProviderResponse {
    return typeof value === 'object' && value !== null
      ? (value as PaymentProviderResponse)
      : {};
  }

  private buildPreferenceProviderResponse(
    preference: MercadoPagoPreferenceResponse,
    preferenceRequest: MercadoPagoPreferencePayload,
  ): PaymentProviderResponse {
    return {
      ...this.toProviderResponse(preference),
      preferenceRequest,
    };
  }
}
