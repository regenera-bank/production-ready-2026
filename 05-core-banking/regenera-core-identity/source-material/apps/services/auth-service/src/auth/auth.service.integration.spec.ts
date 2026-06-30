/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Auth Service - Integration Tests
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/auth-service/src/auth/auth.service.integration.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtService } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { USER_SERVICE_NAME } from '@repo/grpc-definitions';
import { join } from 'path';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthModule } from './auth.module'; // Import the AuthModule

describe('AuthService (Integration)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }), // Required for ConfigService
        ClientsModule.register([
            {
              name: USER_SERVICE_NAME,
              transport: Transport.GRPC,
              options: {
                package: 'user',
                protoPath: join(__dirname, '../../../../packages/grpc-definitions/src/user.proto'),
                url: 'localhost:50051', // Assuming user-service is running
              },
            },
        ]),
        AuthModule, // Import the main AuthModule
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(3001); // Listen on the actual port for integration tests

    authService = moduleFixture.get<AuthService>(AuthService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('User Registration and Login Flow', () => {
    const testUser: RegisterUserDto = {
      fullName: 'Integration Test User',
      email: `integration-test-${Date.now()}@example.com`,
      password: 'password123',
    };

    it('should allow a new user to register', async () => {
      const response = await request(app.getHttpServer())
        .post('/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.fullName).toBe(testUser.fullName);
    });

    it('should prevent registration with an existing email', async () => {
      await request(app.getHttpServer())
        .post('/register')
        .send(testUser) // Attempt to register the same user again
        .expect(409); // Conflict
    });

    it('should allow the registered user to log in', async () => {
      const loginDto: LoginUserDto = {
        email: testUser.email,
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('should reject login with invalid credentials', async () => {
      const loginDto: LoginUserDto = {
        email: testUser.email,
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/login')
        .send(loginDto)
        .expect(401); // Unauthorized
    });

    it('should allow access to protected profile endpoint with a valid token', async () => {
      const loginDto: LoginUserDto = {
        email: testUser.email,
        password: testUser.password,
      };

      const loginResponse = await request(app.getHttpServer())
        .post('/login')
        .send(loginDto)
        .expect(200);

      const accessToken = loginResponse.body.access_token;

      const profileResponse = await request(app.getHttpServer())
        .get('/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('userId');
      expect(profileResponse.body.email).toBe(testUser.email);
    });

    it('should reject access to protected profile endpoint without a token', async () => {
      await request(app.getHttpServer())
        .get('/profile')
        .expect(401); // Unauthorized
    });
  });
});
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
