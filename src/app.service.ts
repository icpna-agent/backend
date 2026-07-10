import { Injectable } from '@nestjs/common';
import { AccessTokenPayload } from './modules/auth/dto/auth.return.types';
import { ApiReturn } from './core/types/core.types';
import { AppHealthStatus, AppHealthStatusInfo } from './app.controller';
import { performance } from 'node:perf_hooks';
import { database } from './db/connection';
import { DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError } from 'pg';

@Injectable()
export class AppService {
  getHello(user: AccessTokenPayload): string {
    return `Hello World! ${user.user}, ${user.id}, ${user.phone}`;
  }

  async check(): Promise<ApiReturn<AppHealthStatus>> {
    const checks: Record<string,AppHealthStatusInfo> = {};

    let isHealthy = true;

    try {
      const start = performance.now();
      await database.execute('SELECT 1;');
      checks['database'] = {
        status: 'up',
        latency: performance.now() - start,
      };
    } catch (error: unknown) {
      if (
        error instanceof DrizzleQueryError
        && error.cause instanceof DatabaseError
      ) {
        console.error("error connecting to database: ", error.cause);
      }
      checks['database'] = {
        status: 'down',
        error: 'Connection failed',
      };
      isHealthy = false;
    }

    return {
      error: !isHealthy,
      body: {
        status: isHealthy ? 'up' : 'down',
        timestamp: new Date().toISOString(),
        checks: {
          database: checks['database'],
        },
      },
    };
  }
}
