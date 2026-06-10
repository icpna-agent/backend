import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { ApiReturn, AuthLoginToken } from "@/modules/auth/dto/auth.return.types";
import { AuthLoginDto } from "./dto/auth.login.dto";
import { AuthRegisterDto } from "./dto/auth.register.dto";
import { AuthGuard } from "@nestjs/passport";
import { Public } from "@/core/decorators/public.decorator";

@Public()
@Controller("auth")
export class AuthController {
    constructor(private readonly impl: AuthService) {}

    @Post("login")
    async login(@Body() loginDto: AuthLoginDto): Promise<ApiReturn<AuthLoginToken | null>> {
        return this.impl.login(loginDto);
    }

    @Post("register")
    async register(@Body() registerDto: AuthRegisterDto): Promise<ApiReturn<AuthLoginToken | null>> {
        return this.impl.register(registerDto);
    }

    @Post("logout")
    async logout(): Promise<ApiReturn<null>> {
        return { error: false, body: null};
    }
}