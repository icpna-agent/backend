import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthLocalStrategy } from "./strategies/auth.local.strategy";
import { AuthJwtStrategy } from "./strategies/auth.jwt.strategy";
import { PassportModule } from "@nestjs/passport";

@Module({
    imports: [
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
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
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    exports: [AuthService, JwtModule],
    providers: [AuthService, AuthRepository, AuthLocalStrategy, AuthJwtStrategy, ConfigService],
})
export class AuthModule {}