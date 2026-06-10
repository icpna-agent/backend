import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './core/decorators/public.decorator';
import { CurrentUser } from './core/decorators/user.decorator';
import type { AccessTokenPayload } from './modules/auth/auth.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(@CurrentUser() user: AccessTokenPayload): string {
    return this.appService.getHello(user);
  }
}
