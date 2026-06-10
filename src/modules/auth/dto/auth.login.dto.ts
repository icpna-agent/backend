import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, Min } from "class-validator";

export class AuthLoginDto {
    @ApiProperty({ type: String, required: true })
    @IsNotEmpty({ message: "USER_MUST_NOT_BE_EMPTY" })
    user!: string;

    @ApiProperty({ type: String, required: true })
    @IsNotEmpty({ message: "PSWD_MUST_NOT_BE_EMPTY" })
    pswd!: string;
}