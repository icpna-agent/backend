import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AccessTokenPayload } from "../dto/auth.return.types";

@Injectable()
export class AuthJwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
    constructor(conf: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: conf.getOrThrow<string>("JWT_REFRESH_SECRET"),
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: AccessTokenPayload):
        AccessTokenPayload & { refresh: string }
    {
        const authHeader = req.headers.authorization;
        const refresh = authHeader?.replace("Bearer ", "").trim() ?? "";

        return {
            ...payload,
            refresh,
        }
    }
}