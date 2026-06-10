import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { AuthRepository, UNIQUE_VIOLATION_CODES } from "./auth.repository";
import { JwtService } from "@nestjs/jwt";
import { User, UserDto } from "@/db/tables/user.table";
import { compare, hash } from "bcrypt";
import { AuthLoginDto } from "./dto/auth.login.dto";
import { ApiReturn, AuthLoginToken } from "./dto/auth.return.types";
import { AuthRegisterDto } from "./dto/auth.register.dto";
import { BCRYPT_NO_ROUNDS } from "./utils/auth.constants";

export interface AccessTokenPayload {
    user: string,
    phone: string,
    id: number,
}

@Injectable()
export class AuthService {
    constructor(
        private readonly repo: AuthRepository,
        private readonly jwt: JwtService,
    ) {}

    async validate(userOrPhone: string, password: string): Promise<User> {
        const user: User | null = await this.repo.findOneByUserOrPhone(userOrPhone);

        if (user == null) {
            throw new UnauthorizedException("USER_NOT_FOUND");
        }

        if (!(await compare(password, user.password))) {
            throw new UnauthorizedException("PASSWORD_DOES_NOT_MATCH");
        }

        return user;
    }

    async login(dto: AuthLoginDto): Promise<ApiReturn<AuthLoginToken>> {
        const user = await this.validate(dto.user, dto.pswd);

        const payload: AccessTokenPayload = { user: user.username, phone: user.phone, id: user.id };

        return {
            error: false,
            body: {
                token: this.jwt.sign(payload),
            },
        };
    }

    async register(newUser: AuthRegisterDto): Promise<ApiReturn<AuthLoginToken>> {
        let created: User | null;

        try {
            created = await this.repo.createUser({
                username: newUser.user,
                password: await hash(newUser.pswd, BCRYPT_NO_ROUNDS),
                phone: newUser.phone,
                mail: newUser.mail,
            });
        } catch (err: unknown) {
            if (err instanceof Error) {
                const msg = err.message;
                if (UNIQUE_VIOLATION_CODES.find((v) => (v === msg)) != null) {
                    throw new BadRequestException(msg);
                }
            }

            throw new InternalServerErrorException("USER_REGISTER_FAILED");
        }

        return this.login({ user: newUser.user, pswd: newUser.pswd });
    } 
}