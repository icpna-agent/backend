import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import type { AccessTokenPayload, ApiReturn, AuthLoginToken } from "@/modules/auth/dto/auth.return.types";
import { AuthLoginDto } from "./dto/auth.login.dto";
import { AuthRegisterDto } from "./dto/auth.register.dto";
import { AuthGuard } from "@nestjs/passport";
import { Public } from "@/core/decorators/public.decorator";
import { CurrentUser } from "@/core/decorators/user.decorator";
import { AuthLocalGuard } from "./guards/auth.local.guard";
import { type User } from "@/db/tables/user.table";
import { AuthJwtRefreshGuard } from "./guards/auth.refresh.guard";

@Controller("auth")
export class AuthController {
    constructor(private readonly impl: AuthService) {}

    @Public()
    @Post("login")
    @UseGuards(AuthLocalGuard)
    async login(@CurrentUser() user: User): Promise<ApiReturn<AuthLoginToken | null>> {
        return this.impl.login(user);
    }

    @Public()
    @Post("register")
    async register(@Body() registerDto: AuthRegisterDto): Promise<ApiReturn<AuthLoginToken | null>> {
        return this.impl.register(registerDto);
    }

    @Post("logout")
    async logout(@CurrentUser() user: User): Promise<ApiReturn<null>> {
        return this.impl.logout(Number(user.id));
    }

    @Public()
    @Post("refresh")
    @UseGuards(AuthJwtRefreshGuard)
    async refresh(
        @CurrentUser("id") userId: number,
        @CurrentUser() payload: AccessTokenPayload & { refresh: string })
    {
        return this.impl.refresh(userId, payload.refresh);
    }
}