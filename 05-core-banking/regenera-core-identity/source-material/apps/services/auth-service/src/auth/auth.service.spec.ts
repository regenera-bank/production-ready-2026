/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Auth Service - Unit Tests
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/auth-service/src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { USER_SERVICE_NAME } from '@repo/grpc-definitions';
import { ConflictException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HttpService } from '@nestjs/axios';
import { AppConfigService } from '@repo/config';
import { of, throwError } from 'rxjs';

// Mock the gRPC client proxy
const mockClientGrpc = {
  getService: jest.fn(() => ({
    findOneByEmail: jest.fn(),
  })),
};

// Mock JwtService
const mockJwtService = {
  sign: jest.fn(() => 'mockAccessToken'),
};

// Mock HttpService
const mockHttpService = {
  post: jest.fn(),
};

// Mock AppConfigService
const mockAppConfigService = {
  getUserServiceUrl: jest.fn(() => 'http://localhost:3002'),
  get: jest.fn((key, defaultValue) => {
    if (key === 'COOKIE_DOMAIN') return 'localhost';
    if (key === 'BCRYPT_SALT_ROUNDS') return '10';
    return defaultValue;
  }),
};

describe('AuthService (Unit)', () => {
  let service: AuthService;
  let userServiceGrpcMock: any;
  let httpServiceMock: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: USER_SERVICE_NAME,
          useValue: mockClientGrpc,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    service.onModuleInit(); 
    userServiceGrpcMock = mockClientGrpc.getService();
    httpServiceMock = mockHttpService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return successful login and set secure cookie', async () => {
      const mockUser = { id: '1', email: 'test@example.com', passwordHash: await bcrypt.hash('password123', 10), fullName: 'Test User' };
      jest.spyOn(service, 'validateUser' as any).mockResolvedValue(mockUser);

      const mockRes = {
        cookie: jest.fn(),
      };

      const result = await service.login('test@example.com', 'password123', mockRes);
      
      expect(result).toEqual({ 
          message: 'Login successful',
          user: { id: '1', email: 'test@example.com' } 
      });
      
      expect(mockRes.cookie).toHaveBeenCalledWith('jwt_token', 'mockAccessToken', expect.objectContaining({
        httpOnly: true,
        path: '/',
        domain: 'localhost',
        sameSite: 'strict',
      }));
    });
  });
});