import { Test, TestingModule } from "@nestjs/testing";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

describe('AuthController', () => {
    let authCntrl: AuthController;

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [AuthService],
        }).compile();

        authCntrl = app.get<AuthController>(AuthController);
    });

    describe('login process', () => {
        it('should return an object with a token property', () => {
            expect(authCntrl.login({
                user: "user",
                pswd: "AB_pass74=D@",
            })).toHaveProperty("body.token");
        });
    });

    describe('register process', () => {
        it('should return an object with a token property', () => {
            expect(authCntrl.register({
                user: "user",
                pswd: "AB_pass74=D@",
                phone: "956213845",
                mail: "adfadsf@gmail.com",
            })).toHaveProperty("body.token");
        });
    });

    describe('logout process', () => {
        it('should always succeed', () => {
            expect(authCntrl.logout())
                .toHaveProperty("error", false);
        });
    });
});