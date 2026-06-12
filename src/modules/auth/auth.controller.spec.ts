import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ExecutionContext } from "@nestjs/common";
import request from "supertest";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthLocalGuard } from "./guards/auth.local.guard";
import { AuthJwtRefreshGuard } from "./guards/auth.refresh.guard";
import { AuthJwtGuard } from "./guards/auth.jwt.guard";

describe('AuthController', () => {
    let authCntrl: AuthController;
    let app: INestApplication;

    beforeEach(async () => {
        const mockAuthService = {
            login: jest.fn().mockResolvedValue({ error: false, body: { token: 'tok', refresh: 'ref' } }),
            register: jest.fn().mockResolvedValue({ error: false, body: { token: 'tok', refresh: 'ref' } }),
            logout: jest.fn().mockResolvedValue({ error: false, body: null }),
            refresh: jest.fn().mockResolvedValue({ error: false, body: { token: 'tok', refresh: 'ref' } }),
        };

        const mockLocalGuard = {
            canActivate: (context: ExecutionContext) => {
                const request = context.switchToHttp().getRequest();
                request.user = { id: 1, user: 'user', phone: '956213845' };
                return true;
            },
        };

        const mockRefreshGuard = {
            canActivate: (context: ExecutionContext) => {
                const request = context.switchToHttp().getRequest();
                request.user = { id: 1, user: 'user', phone: '956213845', refresh: 'ref' };
                return true;
            },
        };

        const mockJwtGuard = {
            canActivate: (context: ExecutionContext) => {
                const request = context.switchToHttp().getRequest();
                request.user = { id: 1, user: 'user', phone: '956213845' };
                return true;
            },
        };

        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: mockAuthService }],
        })
            .overrideGuard(AuthLocalGuard)
            .useValue(mockLocalGuard)
            .overrideGuard(AuthJwtRefreshGuard)
            .useValue(mockRefreshGuard)
            .overrideGuard(AuthJwtGuard)
            .useValue(mockJwtGuard)
            .compile();

        authCntrl = moduleFixture.get<AuthController>(AuthController);
        app = moduleFixture.createNestApplication();
        await app.init();
    });

    /*describe('login process', () => {
        it('should return an object with a token property', async () => {
            await expect(authCntrl.login({
                user: 'user',
                pswd: 'AB_pass74=D@',
            })).resolves.toHaveProperty('body.token');
        });
    });

    describe('register process', () => {
        it('should return an object with a token property', async () => {
            await expect(authCntrl.register({
                user: 'user',
                pswd: 'AB_pass74=D@',
                phone: '956213845',
                mail: 'adfadsf@gmail.com',
            })).resolves.toHaveProperty('body.token');
        });
    });*/

    describe('logout process', () => {
        it('should always succeed', async () => {
            await expect(authCntrl.logout({ id: 1 } as any)).resolves.toHaveProperty('error', false);
        });
    });

    describe('http auth routes', () => {
        it('POST /auth/login should work with a mocked LocalGuard', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ user: 'user', pswd: 'AB_pass74=D@' })
                .expect(200);

            expect(response.body).toHaveProperty('error', false);
            expect(response.body).toHaveProperty('body.token');
        });

        it('POST /auth/refresh should work with a mocked RefreshGuard', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/refresh')
                .set('Authorization', 'Bearer test-refresh-token')
                .expect(201);

            expect(response.body).toHaveProperty('error', false);
            expect(response.body).toHaveProperty('body.refresh');
        });

        it('GET /auth/me should return user session info', async () => {
            const response = await request(app.getHttpServer())
                .get('/auth/me')
                .set('Authorization', 'Bearer test-token')
                .expect(200);

            expect(response.body).toHaveProperty('error', false);
            expect(response.body).toHaveProperty('body.id', 1);
            expect(response.body).toHaveProperty('body.user', 'user');
            expect(response.body).toHaveProperty('body.phone', '956213845');
        });

        it('POST /auth/register should return a token object or emit an "existing user error"',
            async () => {
                const response = await request(app.getHttpServer())
                    .post('/auth/register')
                    .send({
                        user: 'user',
                        pswd: 'AB_pass74=D@',
                        phone: '956213845',
                        mail: 'adfadsf@gmail.com',
                    });
                
                if (response.status === 201) {
                    expect(response.body).toHaveProperty('error', false);
                    expect(response.body).toHaveProperty('body.token');
                } else {
                    expect(response.status).toBe(409)
                }
            }
        )
    });

    afterEach(async () => {
        await app.close();
    });
});
