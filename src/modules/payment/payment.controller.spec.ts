import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController', () => {
    let controller: PaymentController;
    let mockPaymentService: {
        payment: jest.Mock;
        subscriptionStatus: jest.Mock;
    };

    beforeEach(async () => {
        mockPaymentService = {
            payment: jest.fn().mockResolvedValue({ error: false, transactionId: 'tx_123' }),
            subscriptionStatus: jest.fn().mockResolvedValue({ isActive: true, expiresAt: '2026-12-31T23:59:59Z' }),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [PaymentController],
            providers: [{ provide: PaymentService, useValue: mockPaymentService }],
        }).compile();

        controller = module.get<PaymentController>(PaymentController);
    });

    describe('payment', () => {
        it('should return payment response with error false', async () => {
            const result = await controller.makePayment({ amount: 100, currency: 'USD' });

            expect(result).toHaveProperty('error', false);
        });
    });
  
    describe('subscription', () => {
        it('should return subscription status with isActive true and an expiration date', async () => {
            const result = await controller.getSubscriptionStatus();

            expect(result).toHaveProperty('body.isActive', true);
            expect(result).toHaveProperty('body.expiresAt');
            expect(new Date(result.expiresAt).toString()).not.toBe(null);
        });
    });
});