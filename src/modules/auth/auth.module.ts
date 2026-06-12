import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { JwtModule } from "@nestjs/jwt";
import { AuthLocalStrategy } from "./strategies/auth.local.strategy";
import { AuthJwtStrategy } from "./strategies/auth.jwt.strategy";
import { PassportModule } from "@nestjs/passport";
import { AuthJwtRefreshStrategy } from "./strategies/auth.jwt.refresh.strategy";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [
        ConfigModule,
        PassportModule,
        JwtModule.register({
            /*imports: [ConfigModule],
            useFactory: async (conf: ConfigService) => ({
                secret: conf.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: parseInt(
                        conf.getOrThrow<string>(
                            'ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC',
                        ),
                    ),
                },
            }),
            inject: [ConfigService],*/
        }),
    ],
    controllers: [AuthController],
    exports: [AuthService],
    providers: [
        AuthService,
        AuthRepository,
        AuthLocalStrategy,
        AuthJwtStrategy,
        AuthJwtRefreshStrategy,
        ConfigService,
    ],
})
export class AuthModule {}