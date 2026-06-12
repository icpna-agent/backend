import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from './../src/app.module';

describe('PaymentController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  it('/payment/subscription-status (GET) should return protected data', async () => {
    const token = await jwtService.signAsync(
      { user: 'user', phone: '956213845', id: 1 },
      { secret: process.env.JWT_SECRET ?? 'test-secret', expiresIn: '1h' },
    );

    const response = await request(app.getHttpServer())
      .get('/payment/subscription-status')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('error', false);
    expect(response.body).toHaveProperty('body.isActive', true);
  });

  afterEach(async () => {
    await app.close();
  });
});
