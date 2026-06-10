import { Injectable } from '@nestjs/common';
import { AccessTokenPayload } from './modules/auth/auth.service';

@Injectable()
export class AppService {
  getHello(user: AccessTokenPayload): string {
    return `Hello World! ${user.user}, ${user.id}, ${user.phone}`;
  }
}
