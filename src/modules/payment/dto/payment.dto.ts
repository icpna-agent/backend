import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsString } from "class-validator";

/*export class PaymentDto {
    @ApiProperty({ type: Number, required: true })
    @IsNumber()
    @IsNotEmpty({ message: "AMOUNT_MUST_NOT_BE_EMPTY" })
    amount!: number;

    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty({ message: "CURRENCY_MUST_NOT_BE_EMPTY" })
    currency!: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty({ message: "PAYMENT_METHOD_MUST_NOT_BE_EMPTY" })
    paymentMethod!: string;
}*/
export class PaymentDto {
    @ApiProperty({ type: String, required: true })
    @IsString()
    name!: string;

    @ApiProperty({ type: Number, required: true })
    @IsInt()
    @Type(() => Number)
    price!: number;

    @ApiProperty({ type: Number, required: true })
    @IsInt()
    @Type(() => Number)
    unit!: number;

    @ApiProperty({ type: String, required: true })
    @IsString()
    img!: string;
}