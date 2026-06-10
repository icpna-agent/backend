import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class AuthRegisterDto {
    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty({ message: "USER_MUST_NOT_BE_EMPTY" })
    user!: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty({ message: "PSWD_MUST_NOT_BE_EMPTY" })
    pswd!: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty({ message: "PHONE_MUST_NOT_BE_EMPTY" })
    phone!: string;

    @ApiProperty({ type: String, required: true })
    @IsEmail({}, { message: "MAIL_MUST_BE_VALID" })
    @IsNotEmpty({ message: "MAIL_MUST_NOT_BE_EMPTY" })
    mail!: string;
}