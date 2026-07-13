import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscriptionStatusDto {
  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: String })
  plan!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  expiryDate!: string | null;

  @ApiProperty({ type: Boolean })
  isActive!: boolean;
}

export class PaymentHistoryItemDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty({
    enum: [
      'pending',
      'approved',
      'rejected',
      'cancelled',
      'refunded',
      'failed',
    ],
  })
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  statusDetail!: string | null;

  @ApiPropertyOptional({ nullable: true })
  paidAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}
