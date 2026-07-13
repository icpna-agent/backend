import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CurrentUser } from '@core/decorators/user.decorator';
import type { AccessTokenPayload } from '@modules/auth/dto/auth.return.types';
import { Public } from '@core/decorators/public.decorator';
import { ApiReturn } from '@core/types/core.types';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppHealthResponseDto } from './app.dto';

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

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('hello')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Endpoint de prueba autenticado' })
  @ApiOkResponse({
    schema: {
      type: 'string',
      example: 'Hello World! santi, 1, 951364862',
    },
  })
  getHello(@CurrentUser() user: AccessTokenPayload): string {
    return this.appService.getHello(user);
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Verifica la salud del backend y la base de datos' })
  @ApiOkResponse({ type: AppHealthResponseDto })
  async check(): Promise<ApiReturn<AppHealthStatus>> {
    return this.appService.check();
  }
}
