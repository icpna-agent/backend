import { AccessTokenPayload } from "@modules/auth/dto/auth.return.types";
import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator(
    (data: keyof AccessTokenPayload | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<{ user: AccessTokenPayload}>();
        const user = request.user;

        return data ? user[data] : user;
    },
);
