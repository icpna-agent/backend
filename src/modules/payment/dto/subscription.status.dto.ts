import { ApiProperty } from "@nestjs/swagger";

export class SubscriptionStatusDto {
    @ApiProperty({ type: String })
    status!: string;

    @ApiProperty({ type: String })
    plan!: string;

    @ApiProperty({ type: String })
    expiryDate!: string;

    @ApiProperty({ type: Boolean })
    isActive!: boolean;
}
