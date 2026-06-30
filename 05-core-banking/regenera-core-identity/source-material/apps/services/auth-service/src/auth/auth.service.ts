/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Auth Service (Security Audit Fixes)
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/auth-service/src/auth/auth.service.ts
import { 
  Injectable, 
  UnauthorizedException, 
  ConflictException, 
  Inject, 
  OnModuleInit, 
  InternalServerErrorException,
  Logger 
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import { USER_SERVICE_NAME } from '@repo/grpc-definitions';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AppConfigService } from '@repo/config';

interface UserServiceGrpc {
  findOneByEmail(request: { email: string }): Promise<any>;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private userService: UserServiceGrpc;
  private readonly logger = new Logger(AuthService.name);
  private readonly userServiceBaseUrl: string;

  constructor(
    @Inject(USER_SERVICE_NAME) private readonly client: ClientGrpc,
    private readonly jwtService: JwtService,
    private readonly httpService: HttpService,
    private readonly appConfigService: AppConfigService,
  ) {
    // BUG #2: Corrigido para buscar a URL correta do User Service.
    // Antes estava getAccountServiceUrl(), o que era um tiro no pé.
    this.userServiceBaseUrl = this.appConfigService.getUserServiceUrl();
  }

  onModuleInit() {
    this.userService = this.client.getService<UserServiceGrpc>(USER_SERVICE_NAME);
  }

  async validateUser(email: string, pass: string): Promise<any> {
    try {
      // Don Paulo: Busca via gRPC. Performance em primeiro lugar.
      const user = await this.userService.findOneByEmail({ email });
      if (user && await bcrypt.compare(pass, user.passwordHash)) {
        const { passwordHash, ...result } = user;
        return result;
      }
    } catch (error) {
        // BUG #3: Tratamento de erro gRPC. Se o erro for 5 (NOT_FOUND), 
        // a gente só retorna null. Se for outro, loga como erro crítico.
        if (error.code !== 5) {
          this.logger.error(`gRPC error during user validation: ${error.message}`);
        }
        return null;
    }
    return null;
  }

  async login(email: string, pass: string, res: any) {
    const user = await this.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }
    
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    // BUG #4: Cookie Path/Domain configurados.
    // Evita overhead de enviar o cookie para subdomínios desnecessários.
    const cookieDomain = this.appConfigService.get('COOKIE_DOMAIN', 'localhost');
    
    res.cookie('jwt_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000, 
      path: '/', // Garantindo o path root pra evitar confusão.
      domain: cookieDomain,
    });
    
    return {
      message: 'Login successful',
      user: { id: user.id, email: user.email },
    };
  }

  async register(registerUserDto: RegisterUserDto): Promise<any> {
    try {
        // BUG #3: Verificação de duplicidade robusta.
        const userExists = await this.userService.findOneByEmail({ email: registerUserDto.email })
          .catch(err => err.code === 5 ? null : Promise.reject(err));

        if (userExists) {
          throw new ConflictException('User with this email already exists.');
        }
    } catch (error) {
        if (error instanceof ConflictException) throw error;
        this.logger.error(`Failed to pre-verify user existence: ${error.message}`);
        throw new InternalServerErrorException("Registration service temporarily unavailable.");
    }

    // BUG #5: Bcrypt rounds via config. Hardcoded nunca mais.
    const saltRounds = parseInt(this.appConfigService.get('BCRYPT_SALT_ROUNDS', '12'), 10);
    const passwordHash = await bcrypt.hash(registerUserDto.password, saltRounds);

    try {
        const response$ = this.httpService.post(`${this.userServiceBaseUrl}/users`, {
            ...registerUserDto,
            passwordHash,
        }).pipe(
          catchError(err => {
            this.logger.error(`REST call to user-service failed: ${err.message}`);
            return throwError(() => new InternalServerErrorException("User creation failed."));
          })
        );

        const newUser = await firstValueFrom(response$);
        const { passwordHash: _, ...result } = newUser.data;
        return result;
    } catch(error) {
        throw error;
    }
  }
}