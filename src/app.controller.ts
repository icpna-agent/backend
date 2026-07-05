import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CurrentUser } from './core/decorators/user.decorator';
import type { AccessTokenPayload } from './modules/auth/dto/auth.return.types';
import { Public } from './core/decorators/public.decorator';
import { ApiReturn } from './core/types/core.types';

export type AppHealthStatusLevels = 'up' | 'weak' | 'down';

export interface AppHealthStatusInfo {
  status: AppHealthStatusLevels;
  latency?: number;
  error?: string;
}

export interface AppHealthStatus {
  status: AppHealthStatusLevels;
  timestamp: string;
  checks: {
    database: AppHealthStatusInfo;
  }
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  getHello(@CurrentUser() user: AccessTokenPayload): string {
    return this.appService.getHello(user);
  }

  @Public()
  @Get('health')
  async check(): Promise<ApiReturn<AppHealthStatus>> {
    return this.appService.check();
  }
}
