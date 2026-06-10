import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthJwtGuard } from './modules/auth/guards/auth.jwt.guard';
import { AuthJwtStrategy } from './modules/auth/strategies/auth.jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    PaymentModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthJwtGuard,
    },
    AuthJwtStrategy,
  ],
})
export class AppModule {}
