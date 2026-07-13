import { PaymentService } from '../src/modules/payment/payment.service';
import { PaymentRepository } from '../src/repositories/payment.repository';

type MercadoPagoPreferencePayload = {
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  auto_return?: string;
  external_reference: string;
  payer?: {
    email?: string;
    name?: string;
    phone?: { number?: string };
  };
};

describe('PaymentService', () => {
  const user = {
    id: 7,
    username: 'codex_test',
    mail: 'codex_test@example.com',
    phone: '51911111111',
  };
  const pendingPayment = {
    id: 12,
    userId: user.id,
    externalReference: 'subscription:7:basic:1783890000000',
    status: 'pending',
    amount: '5.00',
    currency: 'PEN',
    checkoutUrl: null,
    providerPreferenceId: null,
    rawProviderResponse: null,
    engineEnabledAt: null,
  };
  const oldPendingPayment = {
    ...pendingPayment,
    id: 14,
    checkoutUrl: 'https://mercadopago.com.pe/checkout/v1/redirect',
    providerPreferenceId: 'old-preference',
    rawProviderResponse: { id: 'old-preference' },
  };

  let repository: Record<string, jest.Mock>;
  let service: PaymentService;
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    process.env.MERCADO_PAGO_ACCESS_TOKEN = 'test-token';
    process.env.LANDING_URL = 'https://front.icpna.test';
    process.env.BACKEND_URL = 'https://api.icpna.test';
    delete process.env.MERCADO_PAGO_USE_SANDBOX_LINK;

    repository = {
      findUserById: jest.fn().mockResolvedValue(user),
      findReusablePending: jest.fn().mockResolvedValue(undefined),
      createPayment: jest.fn().mockResolvedValue(pendingPayment),
      updatePayment: jest.fn().mockResolvedValue(pendingPayment),
      findSubscription: jest.fn().mockResolvedValue(undefined),
      markSubscriptionExpired: jest.fn(),
      findPaymentHistory: jest.fn().mockResolvedValue([]),
      findByExternalReference: jest.fn().mockResolvedValue(pendingPayment),
      approveAndActivate: jest.fn().mockResolvedValue({ activated: true }),
    };
    service = new PaymentService(repository as unknown as PaymentRepository);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.MERCADO_PAGO_ACCESS_TOKEN;
    delete process.env.LANDING_URL;
    delete process.env.BACKEND_URL;
    delete process.env.MERCADO_PAGO_USE_SANDBOX_LINK;
  });

  it('creates Mercado Pago preferences with return URLs and auto return enabled', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        id: 'preference-1',
        init_point: 'https://mercadopago.test/checkout',
      }),
    });

    const result = await service.makePayment(user.id);
    const request = (global.fetch as jest.Mock).mock.calls[0][1] as {
      body: string;
    };
    const requestBody = JSON.parse(
      request.body,
    ) as MercadoPagoPreferencePayload;

    expect(requestBody.back_urls).toEqual({
      success: 'https://front.icpna.test/success',
      failure: 'https://front.icpna.test/success?result=failure',
      pending: 'https://front.icpna.test/success?result=pending',
    });
    expect(requestBody.auto_return).toBe('approved');
    expect(requestBody.payer).toEqual({
      name: user.username,
      phone: { number: user.phone },
    });
    expect(requestBody.payer?.email).toBeUndefined();
    expect(repository.updatePayment).toHaveBeenCalledWith(
      pendingPayment.id,
      expect.objectContaining({
        providerPreferenceId: 'preference-1',
        checkoutUrl: 'https://mercadopago.test/checkout',
        rawProviderResponse: expect.objectContaining({
          preferenceRequest: expect.objectContaining({
            back_urls: requestBody.back_urls,
            auto_return: 'approved',
          }),
        }),
      }),
    );
    expect(result.body.mpLink).toBe('https://mercadopago.test/checkout');
  });

  it('does not reuse old pending checkouts that were created without current return URLs', async () => {
    repository.findReusablePending.mockResolvedValue(oldPendingPayment);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        id: 'preference-2',
        init_point: 'https://mercadopago.test/new-checkout',
      }),
    });

    const result = await service.makePayment(user.id);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.mercadopago.com/checkout/preferences',
      expect.any(Object),
    );
    expect(result.body).toEqual(
      expect.objectContaining({
        mpLink: 'https://mercadopago.test/new-checkout',
        preferenceId: 'preference-2',
        transactionId: pendingPayment.id,
      }),
    );
  });
});
