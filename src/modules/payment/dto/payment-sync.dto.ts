import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PaymentSyncDto {
  @ApiProperty({ example: '123456789' })
  @IsString()
  @IsNotEmpty()
  paymentId!: string;
}
