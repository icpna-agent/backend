import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentDto } from './dto/payment.dto';
import { SubscriptionStatusDto } from './dto/subscription.status.dto';
import { ApiReturn } from '@/core/types/core.types';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
    constructor(private readonly impl: PaymentService) {}

    @Post('make-payment')
    @ApiOperation({ summary: 'Crea una preferencia de pago directa en Mercado Pago y devuelve el checkout URL' })
    async makePayment(@Body() paymentDto: PaymentDto): Promise<ApiReturn<{ mpLink: string; preferenceId?: string } | null>> {
        return this.impl.makePayment(paymentDto);
    }

    @Get('subscription-status')
    async getSubscriptionStatus(): Promise<ApiReturn<SubscriptionStatusDto | null>> {
        return this.impl.getSubscriptionStatus();
    }

    @Post('webhook')
    @HttpCode(200)
    @ApiOperation({ summary: 'Webhook para recibir notificaciones de Mercado Pago' })
    async webhook(@Body() body: unknown, @Query() query: Record<string, unknown>) {
        return this.impl.handleMercadoPagoWebhook(body, query);
    }
}
