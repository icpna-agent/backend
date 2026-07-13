import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from '../src/modules/payment/payment.controller';
import { PaymentService } from '../src/modules/payment/payment.service';

describe('PaymentController', () => {
    let controller: PaymentController;
    let mockPaymentService: {
        makePayment: jest.Mock;
        getSubscriptionStatus: jest.Mock;
        getPaymentHistory: jest.Mock;
        syncPayment: jest.Mock;
        handleMercadoPagoWebhook: jest.Mock;
    };

    beforeEach(async () => {
        mockPaymentService = {
            makePayment: jest.fn().mockResolvedValue({ error: false, transactionId: 'tx_123' }),
            getSubscriptionStatus: jest.fn().mockResolvedValue({ error: false, body: { isActive: true, expiryDate: '2026-12-31T23:59:59Z' } }),
            getPaymentHistory: jest.fn().mockResolvedValue({ error: false, body: [] }),
            syncPayment: jest.fn(),
            handleMercadoPagoWebhook: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [PaymentController],
            providers: [{ provide: PaymentService, useValue: mockPaymentService }],
        }).compile();

        controller = module.get<PaymentController>(PaymentController);
    });

    describe('payment', () => {
        it('should return payment response with error false', async () => {
            const result = await controller.makePayment(1);

            expect(result).toHaveProperty('error', false);
        });
    });
  
    describe('subscription', () => {
        it('should return subscription status with isActive true and an expiration date', async () => {
            const result = await controller.getSubscriptionStatus(1);

            expect(result).toHaveProperty('body.isActive', true);
            expect(result).toHaveProperty('body.expiryDate');
            expect(new Date(result.body.expiryDate).toString()).not.toBe('Invalid Date');
        });
    });
});
