import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";
import { AuthLoginDto } from "../dto/auth.login.dto";
import { User } from "@/db/tables/user.table";

@Injectable()
export class AuthLocalStrategy extends PassportStrategy(Strategy) {
    constructor (private readonly service: AuthService) {
        super({
            usernameField: 'username',
        });
    }

    async validate(loginInfo: AuthLoginDto): Promise<User> {
        const user = await this.service.validate(loginInfo.user, loginInfo.pswd);
        return user;
    }
}