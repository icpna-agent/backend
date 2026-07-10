import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { PaymentService } from './payment.service';
import { PaymentDto } from './dto/payment.dto';
import { SubscriptionStatusDto } from './dto/subscription.status.dto';
import { ApiReturn } from '@/core/types/core.types';
import { Public } from '@/core/decorators/public.decorator';
import { CurrentUser } from '@/core/decorators/user.decorator';
import type { AccessTokenPayload } from '@/modules/auth/dto/auth.return.types';

@Controller('payment')
export class PaymentController {
    constructor(private readonly impl: PaymentService) {}

    @Post('make-payment')
    async makePayment(
        @Body() paymentDto: PaymentDto,
        @CurrentUser('id') userId: number,
    ): Promise<ApiReturn<{ mpLink: string } | { message: string } | null>> {
        return this.impl.makePayment(paymentDto, userId);
    }

    @Get('subscription-status')
    async getSubscriptionStatus(
        @CurrentUser('id') userId: number,
    ): Promise<ApiReturn<SubscriptionStatusDto | null>> {
        return this.impl.getSubscriptionStatus(userId);
    }

    @Post('get-notifs-from-mp')
    @Public()
    async getNotificationsFromMp(@Req() request: ExpressRequest, @Res() response: ExpressResponse): Promise<void> {
        await this.impl.reactAgainstMpNotif(request, response);
    }
}
