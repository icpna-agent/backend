import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { database } from '@/db/connection';
import { subscription } from '@/db/tables';
import { eq, and, lt } from 'drizzle-orm';

@Injectable()
export class SubscriptionTaskService {
    private readonly logger = new Logger(SubscriptionTaskService.name);

    @Cron(CronExpression.EVERY_HOUR)
    async markExpiredSubscriptions() {
        try {
            const now = new Date();
            const result = await database
                .update(subscription)
                .set({ status: 'expired', updated_at: now })
                .where(
                    and(
                        eq(subscription.status, 'active'),
                        lt(subscription.expires_at, now),
                    ),
                )
                .returning();

            if (result.length > 0) {
                this.logger.log(`Marked ${result.length} subscriptions as expired`);
            }
        } catch (error) {
            this.logger.error('Error marking expired subscriptions:', error);
        }
    }
}
