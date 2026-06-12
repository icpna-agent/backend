import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";
import { User } from "@/db/tables/user.table";

@Injectable()
export class AuthLocalStrategy extends PassportStrategy(Strategy, "local") {
    constructor (private readonly service: AuthService) {
        super({
            usernameField: 'user',
            passwordField: 'pswd',
        });
    }

    async validate(user: string, pswd: string): Promise<User> {
        const validUser = await this.service.validate(user, pswd);
        return validUser;
    }
}