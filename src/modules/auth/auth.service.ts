import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { AuthRepository, UNIQUE_VIOLATION_CODES } from "./auth.repository";
import { JwtService } from "@nestjs/jwt";
import { User } from "@/db/tables/user.table";
import { compare, hash } from "bcrypt";
import { AccessTokenPayload, ApiReturn, AuthLoginToken } from "./dto/auth.return.types";
import { AuthRegisterDto } from "./dto/auth.register.dto";
import { BCRYPT_NO_ROUNDS } from "./utils/auth.constants";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
    private readonly tokens = { token: "", refresh: "" };

    constructor(
        private readonly repo: AuthRepository,
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
    ) {}

    async validate(userOrPhone: string, password: string): Promise<User> {
        const user: User | null = await this.repo.findOneByUserOrPhone(userOrPhone);

        if (user == null) {
            throw new UnauthorizedException("Usuario no encontrad");
        }

        if (!(await compare(password, user.password))) {
            throw new UnauthorizedException("Contraseña incorrecta");
        }

        return user;
    }

    async login(user: User): Promise<ApiReturn<AuthLoginToken>> {
        //const user = await this.validate(dto.user, dto.pswd);
        const tokens = await this.makeTokens(user);
        await this.updateRefreshToken(user.id, tokens.refresh);

        return {
            error: false,
            body: tokens,
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
                if (UNIQUE_VIOLATION_CODES.find((v) => v === msg) != null) {
                    throw new ConflictException(msg);
                }
            }

            throw new InternalServerErrorException("Registro fallido, intente más tarde");
        }

        if (created == null) {
            throw new InternalServerErrorException("Registro fallido, intente más tarde");
        }

        try {
            const adminEmail = this.config.getOrThrow<string>("ADMIN_MAIL");
            const adminPassword = this.config.getOrThrow<string>("ADMIN_PSWD");

            const loginResponse = await this.engineRequest<{ accessToken: string; user: { id: number; name: string; email: string; roles: string[] } }>(
                "/auth/login",
                {
                    email: adminEmail,
                    password: adminPassword,
                },
            );

            await this.engineRequest<unknown>(
                "/admin/user/create",
                {
                    phone: newUser.phone,
                    enabled: true,
                    enabledFrom: new Date().toISOString(),
                    enabledTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                },
                loginResponse.accessToken,
            );
        } catch (err: unknown) {
            throw new InternalServerErrorException("Registro fallido, intente más tarde");
        }

        return this.login(created);
    }

    private async engineRequest<T>(path: string, body?: unknown, bearerToken?: string): Promise<T> {
        const engineHost = this.config.getOrThrow<string>("ENGINE_HOST");
        const url = new URL(path, engineHost);
        const module = url.protocol === "https:" ? await import("node:https") : await import("node:http");
        const data = body ? JSON.stringify(body) : undefined;
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(data ? { "Content-Length": Buffer.byteLength(data).toString() } : {}),
            ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
        };

        return new Promise<T>((resolve, reject) => {
            const req = module.request(url, { method: "POST", headers }, (res: any) => {
                const chunks: Uint8Array[] = [];
                res.on("data", (chunk: Uint8Array) => chunks.push(chunk));
                res.on("end", () => {
                    const text = Buffer.concat(chunks).toString("utf8");
                    if (res.statusCode! >= 200 && res.statusCode! < 300) {
                        try {
                            const parsed = text ? JSON.parse(text) : (null as unknown);
                            resolve(parsed as T);
                        } catch (parseErr) {
                            reject(parseErr);
                        }
                    } else {
                        reject(new Error(`Engine request failed ${res.statusCode}: ${text}`));
                    }
                });
            });

            req.on("error", reject);
            if (data) {
                req.write(data);
            }
            req.end();
        });
    }

    async refresh(
        userId: number,
        refresh: string,
    ): Promise<ApiReturn<AuthLoginToken>> {
        const user = await this.repo.findById(userId);

        if (!user || !user.refreshHash) {
            throw new UnauthorizedException("No autorizado");
        }

        const isValid = compare(refresh, user.refreshHash);

        if (!isValid) {
            throw new UnauthorizedException("Sesión inválida");
        }

        const tokens = await this.makeTokens(user);
        await this.updateRefreshToken(user.id, tokens.refresh!);
        return {
            error: false,
            body: tokens,
        };
    }

    async logout(userId: number): Promise<ApiReturn<null>> {
        await this.repo.updateUser(userId, {
            refreshHash: null,
        });

        return {
            error: false,
            body: null,
        }
    }

    private async makeTokens(user: User): Promise<AuthLoginToken> {
        const payload: AccessTokenPayload = {
            user: user.username,
            phone: user.phone,
            id: user.id,
        };

        const tokenLife = parseInt(
            this.config.getOrThrow<string>("ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC")
        );

        const refreshLife = parseInt(
            this.config.getOrThrow<string>("REFRESH_TOKEN_VALIDITY_DURATION_IN_SEC")
        );

        const [token, refresh] = await Promise.all([
            this.jwt.signAsync(payload, {
                secret: this.config.getOrThrow<string>("JWT_SECRET"),
                expiresIn: tokenLife,
            }),
            this.jwt.signAsync(payload, {
                secret: this.config.getOrThrow<string>("JWT_REFRESH_SECRET"),
                expiresIn: refreshLife,
            }),
        ]);

        return {
            token,
            refresh,
        };
    }

    private async updateRefreshToken(
        userId: number,
        refreshToken: string
    ): Promise<void> {
        const refreshHash = await hash(refreshToken, BCRYPT_NO_ROUNDS);
        await this.repo.updateUser(userId, { refreshHash });
    }
}