import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { ExecutionContext } from '@nestjs/common';


describe('AppController', () => {
    let appController: AppController;
    let payload = { id: 1, user: 'user', phone: '956213845' }

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [AppController],
            providers: [AppService],
        }).compile();

        appController = app.get<AppController>(AppController);

        
    });

    describe('root', () => {
        it('should return "Hello World!"', () => {
            expect(appController.getHello(payload)).toBe("Hello World! user, 1, 956213845");
        });
    });
});
