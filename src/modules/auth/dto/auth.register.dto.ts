import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class AuthRegisterDto {
    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty({ message: "USER_MUST_NOT_BE_EMPTY" })
    user!: string;

    @ApiProperty({ type: String, required: true })
    @IsString()
    @IsNotEmpty({ message: "PSWD_MUST_NOT_BE_EMPTY" })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message: "PSWD_TOO_EASY",
    })
    @MinLength(12, { message: "PSWD_TOO_SHORT" })
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