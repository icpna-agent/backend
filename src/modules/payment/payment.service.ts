import { Injectable } from "@nestjs/common";
import { PaymentRepository } from "./payment.repository";
import { PaymentDto } from "./dto/payment.dto";
import { ApiReturn } from "../auth/dto/auth.return.types";

@Injectable()
export class PaymentService {
    constructor(private readonly repo: PaymentRepository) {}

    async makePayment(paymentDto: PaymentDto): Promise<ApiReturn<{ mpLink: string} | null>> {
        return {
            error: false,
            body: null,
        }
    }

    async reactAgainstMpNotif() {

    }
}
