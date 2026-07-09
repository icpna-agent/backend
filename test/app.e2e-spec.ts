import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { JwtModule, JwtService } from '@nestjs/jwt';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    jwt = moduleFixture.get<JwtService>(JwtService);
  });

  it('/ (GET)', async () => {
    const token = await jwt.signAsync(
      { user: 'user', phone: '956213845', id: 1 },
      { secret: process.env.JWT_SECRET ?? 'test-secret', expiresIn: '1h' },
    );

    return request(app.getHttpServer())
      .get('/hello')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
  });

  afterEach(async () => {
    await app.close();
  });
});
