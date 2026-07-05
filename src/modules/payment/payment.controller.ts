import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentDto } from './dto/payment.dto';
import { SubscriptionStatusDto } from './dto/subscription.status.dto';
import { ApiReturn } from '@/core/types/core.types';

@Controller('payment')
export class PaymentController {
    constructor(private readonly impl: PaymentService) {}

    @Post('make-payment')
    async makePayment(@Body() paymentDto: PaymentDto): Promise<ApiReturn<{ mpLink: string } | null>> {
        return this.impl.makePayment(paymentDto);
    }

    @Get('subscription-status')
    async getSubscriptionStatus(): Promise<ApiReturn<SubscriptionStatusDto | null>> {
        return this.impl.getSubscriptionStatus();
    }

    @Post('get-notifs-from-mp')
    async getNotificationsFromMp() {
        return { error: true, body: null };
    }
}
