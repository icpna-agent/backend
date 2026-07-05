import { Injectable } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { PaymentDto } from './dto/payment.dto';
import { SubscriptionStatusDto } from './dto/subscription.status.dto';
import { ApiReturn } from '@/core/types/core.types';

@Injectable()
export class PaymentService {
    constructor(private readonly repo: PaymentRepository) {}

    async makePayment(paymentDto: PaymentDto): Promise<ApiReturn<{ mpLink: string} | null>> {
        return {
            error: false,
            body: { mpLink: `https://payment.example.com/pay?amount=${paymentDto.price}&currency=${paymentDto.unit}` },
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

    async reactAgainstMpNotif() {

    }
}
