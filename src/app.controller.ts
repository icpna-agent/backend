import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { CurrentUser } from './core/decorators/user.decorator';
import type { AccessTokenPayload } from './modules/auth/dto/auth.return.types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get("hello")
  getHello(@CurrentUser() user: AccessTokenPayload): string {
    return this.appService.getHello(user);
  }
}
