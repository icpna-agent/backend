import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";

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
export class ItemDto {
    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty()
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
    @IsNotEmpty()
    img!: string;
}

export class PhoneDto {
    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty()
    area_code!: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty()
    number!: string;
}

export class AddressDto {
    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty()
    zip_code!: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty()
    street_name!: string;

    @ApiProperty({ type: String, required: false })
    @IsOptional()
    @IsString()
    street_number?: string;
}

export class PayerDto {
    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty()
    surname!: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ type: PhoneDto, required: true })
    @ValidateNested()
    @Type(() => PhoneDto)
    phone!: PhoneDto;

    @ApiProperty({ type: AddressDto, required: true })
    @ValidateNested()
    @Type(() => AddressDto)
    address!: AddressDto;
}

export class PaymentDto {
    @ApiProperty({ type: ItemDto, required: true })
    @ValidateNested()
    @Type(() => ItemDto)
    item!: ItemDto;

    @ApiProperty({ type: PayerDto, required: true })
    @ValidateNested()
    @Type(() => PayerDto)
    payer!: PayerDto;
}