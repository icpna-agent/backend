import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class AuthJwtRefreshGuard extends AuthGuard("jwt-refresh") {}