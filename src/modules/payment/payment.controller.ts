import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import type { ApiReturn } from "@/modules/auth/dto/auth.return.types";
import { PaymentDto } from "./dto/payment.dto";
import { SubscriptionStatusDto } from "./dto/subscription.status.dto";

@Controller("payment")
export class PaymentController {
    constructor(private readonly impl: PaymentService) {}

    @Post("make-payment")
    async makePayment(@Body() paymentDto: PaymentDto): Promise<ApiReturn<{ transactionId: string } | null>> {
        return { error: true, body: null };
    }

    @Get("subscription-status")
    async getSubscriptionStatus(): Promise<ApiReturn<SubscriptionStatusDto | null>> {
        return { error: true, body: null };
    }
}
