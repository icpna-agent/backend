import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import {
  PaymentHistoryItemDto,
  SubscriptionStatusDto,
} from './dto/subscription.status.dto';
import { ApiReturn } from '@core/types/core.types';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@core/decorators/user.decorator';
import { Public } from '@core/decorators/public.decorator';
import { PaymentSyncDto } from './dto/payment-sync.dto';
import {
  MakePaymentResponseDto,
  PaymentHistoryResponseDto,
  PaymentProcessingResponseDto,
  SubscriptionStatusResponseDto,
} from './dto/payment-result.dto';

@ApiTags('Payment')
@ApiBearerAuth()
@Controller('payment')
export class PaymentController {
  constructor(private readonly impl: PaymentService) {}

  @Post('make-payment')
  @ApiOperation({
    summary:
      'Crea una preferencia de pago directa en Mercado Pago y devuelve el checkout URL',
  })
  @ApiOkResponse({ type: MakePaymentResponseDto })
  async makePayment(
    @CurrentUser('id') userId: number,
  ): Promise<
    ApiReturn<{ mpLink: string; preferenceId?: string; transactionId: number }>
  > {
    return this.impl.makePayment(userId);
  }

  @Get('subscription-status')
  @ApiOperation({ summary: 'Obtiene el estado de suscripción del usuario autenticado' })
  @ApiOkResponse({ type: SubscriptionStatusResponseDto })
  async getSubscriptionStatus(
    @CurrentUser('id') userId: number,
  ): Promise<ApiReturn<SubscriptionStatusDto>> {
    return this.impl.getSubscriptionStatus(userId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Lista los últimos pagos del usuario autenticado' })
  @ApiOkResponse({ type: PaymentHistoryResponseDto })
  async getPaymentHistory(
    @CurrentUser('id') userId: number,
  ): Promise<ApiReturn<PaymentHistoryItemDto[]>> {
    return this.impl.getPaymentHistory(userId);
  }

  @Post('sync')
  @ApiOperation({
    summary:
      'Sincroniza el pago de retorno con Mercado Pago para el usuario autenticado',
  })
  @ApiBody({ type: PaymentSyncDto })
  @ApiOkResponse({ type: PaymentProcessingResponseDto })
  async syncPayment(
    @CurrentUser('id') userId: number,
    @Body() body: PaymentSyncDto,
  ) {
    return this.impl.syncPayment(userId, body.paymentId);
  }

  @Public()
  @Post('webhook')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Webhook para recibir notificaciones de Mercado Pago',
  })
  @ApiBody({
    schema: {
      type: 'object',
      additionalProperties: true,
      example: { type: 'payment', data: { id: '123456789' } },
    },
  })
  @ApiQuery({
    name: 'externalReference',
    required: false,
    description: 'Referencia externa enviada al crear la preferencia',
  })
  @ApiQuery({
    name: 'data.id',
    required: false,
    description: 'ID de pago enviado por Mercado Pago en algunos webhooks',
  })
  @ApiOkResponse({ type: PaymentProcessingResponseDto })
  async webhook(
    @Body() body: unknown,
    @Query() query: Record<string, unknown>,
  ) {
    return this.impl.handleMercadoPagoWebhook(body, query);
  }
}
