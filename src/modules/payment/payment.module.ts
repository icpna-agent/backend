import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";
import { PaymentRepository } from "./payment.repository";
import { PaymentConfig } from "./config/payment.config";
import { SubscriptionTaskService } from "./subscription.task";

@Module({
    imports: [ScheduleModule.forRoot()],
    controllers: [PaymentController],
    providers: [PaymentService, PaymentRepository, PaymentConfig, SubscriptionTaskService],
})
export class PaymentModule {}
