import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AccessTokenPayload, AuthLoginToken } from '@modules/auth/dto/auth.return.types';
import { AuthLoginDto } from './dto/auth.login.dto';
import { AuthRegisterDto } from './dto/auth.register.dto';
import { Public } from '@core/decorators/public.decorator';
import { CurrentUser } from '@core/decorators/user.decorator';
import { AuthLocalGuard } from './guards/auth.local.guard';
import { type User } from '@db/tables/user.table';
import { AuthJwtRefreshGuard } from './guards/auth.refresh.guard';
import { AuthJwtGuard } from './guards/auth.jwt.guard';
import { ApiReturn } from '@core/types/core.types';
import {
    ApiBearerAuth,
    ApiBody,
    ApiCreatedResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
    AuthLogoutResponseDto,
    AuthMeResponseDto,
    AuthTokenResponseDto,
} from './dto/auth-result.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly impl: AuthService) {}

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthLocalGuard)
    @ApiOperation({ summary: 'Inicia sesión con usuario o teléfono y contraseña' })
    @ApiBody({ type: AuthLoginDto })
    @ApiOkResponse({ type: AuthTokenResponseDto })
    @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
    async login(@CurrentUser() user: User): Promise<ApiReturn<AuthLoginToken | null>> {
        return this.impl.login(user);
    }

    @Public()
    @HttpCode(HttpStatus.CREATED)
    @Post('register')
    @ApiOperation({ summary: 'Registra un usuario y devuelve tokens de acceso' })
    @ApiBody({ type: AuthRegisterDto })
    @ApiCreatedResponse({ type: AuthTokenResponseDto })
    async register(@Body() registerDto: AuthRegisterDto): Promise<ApiReturn<AuthLoginToken | null>> {
        return this.impl.register(registerDto);
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cierra la sesión del usuario autenticado' })
    @ApiOkResponse({ type: AuthLogoutResponseDto })
    async logout(@CurrentUser() user: User): Promise<ApiReturn<null>> {
        return this.impl.logout(Number(user.id));
    }

    @Public()
    @HttpCode(HttpStatus.CREATED)
    @Post('refresh')
    @UseGuards(AuthJwtRefreshGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Renueva los tokens usando el refresh token' })
    @ApiCreatedResponse({ type: AuthTokenResponseDto })
    @ApiUnauthorizedResponse({ description: 'Refresh token inválido o expirado' })
    async refresh(
        @CurrentUser('id') userId: number,
        @CurrentUser() payload: AccessTokenPayload & { refresh: string })
    {
        return this.impl.refresh(userId, payload.refresh);
    }

    @Get('me')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthJwtGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Obtiene la sesión del usuario autenticado' })
    @ApiOkResponse({ type: AuthMeResponseDto })
    async me(@CurrentUser() user: AccessTokenPayload): Promise<ApiReturn<AccessTokenPayload>> {
        return {
            error: false,
            body: user,
        };
    }
}
