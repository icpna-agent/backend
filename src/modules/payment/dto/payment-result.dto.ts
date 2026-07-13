import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaymentHistoryItemDto,
  SubscriptionStatusDto,
} from './subscription.status.dto';

export class MakePaymentResultDto {
  @ApiProperty({
    example: 'https://www.mercadopago.com.pe/checkout/v1/redirect?pref_id=...',
  })
  mpLink!: string;

  @ApiPropertyOptional({ example: '123456789-abcdef' })
  preferenceId?: string;

  @ApiProperty({ example: 12 })
  transactionId!: number;
}

export class MakePaymentResponseDto {
  @ApiProperty({ example: false })
  error!: boolean;

  @ApiProperty({ type: MakePaymentResultDto })
  body!: MakePaymentResultDto;
}

export class SubscriptionStatusResponseDto {
  @ApiProperty({ example: false })
  error!: boolean;

  @ApiProperty({ type: SubscriptionStatusDto })
  body!: SubscriptionStatusDto;
}

export class PaymentHistoryResponseDto {
  @ApiProperty({ example: false })
  error!: boolean;

  @ApiProperty({ type: [PaymentHistoryItemDto] })
  body!: PaymentHistoryItemDto[];
}

export class PaymentProcessingResultDto {
  @ApiProperty({ example: true })
  received!: boolean;

  @ApiPropertyOptional({ example: 'approved' })
  paymentStatus?: string;

  @ApiPropertyOptional({ example: true })
  subscriptionActive?: boolean;

  @ApiPropertyOptional({
    example: { enabled: true },
    nullable: true,
  })
  engineResult?: unknown;

  @ApiPropertyOptional({
    example: 'Webhook received without a Mercado Pago payment id.',
  })
  message?: string;
}

export class PaymentProcessingResponseDto {
  @ApiProperty({ example: false })
  error!: boolean;

  @ApiProperty({ type: PaymentProcessingResultDto })
  body!: PaymentProcessingResultDto;
}
