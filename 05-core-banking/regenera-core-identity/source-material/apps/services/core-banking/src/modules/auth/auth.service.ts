/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Authentication

  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky

  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] auth.service.ts

import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
// // DEV NOTE: `jsonwebtoken`, `bcrypt` são dependências externas.
// // Adicionar ao package.json: `npm i jsonwebtoken bcrypt && npm i -D @types/jsonwebtoken @types/bcrypt`
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

// Mock do AppConfigService para demonstrar a correção do BUG #2
@Injectable()
export class AppConfigService {
  getUserServiceUrl = () => 'http://user-service:3000';
  getAccountServiceUrl = () => 'http://account-service:3000';
}

// Mock do UserService para simular a criação e busca de usuários
@Injectable()
export class UserService {
    private users = []; // Simula um banco de dados de usuários

    async findOneByEmail(data: { email: string }): Promise<any> {
        const user = this.users.find(u => u.email === data.email);
        if (!user) {
            // Simula o erro 'NOT_FOUND' de um serviço gRPC ou similar
            const error = new Error('User not found') as any;
            error.code = 'NOT_FOUND';
            throw error;
        }
        return user;
    }

    async createUser(data: any): Promise<any> {
        const newUser = { id: `user_${Date.now()}`, ...data };
        this.users.push(newUser);
        return newUser;
    }
}


@Injectable()
export class AuthService {
  private userServiceBaseUrl: string;

  // Adicionando construtor para injeção de dependência
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly userService: UserService, // Mock
  ) {
    // [BUG #2 CORRIGIDO] Apontar para o serviço correto de usuários.
    this.userServiceBaseUrl = this.appConfigService.getUserServiceUrl();
  }

  async register(registerUserDto: RegisterUserDto): Promise<any> {
    // [BUG #3 CORRIGIDO] Lógica de verificação de duplicatas e tratamento de erro
    let userExists = false;
    try {
        const existingUser = await this.userService.findOneByEmail({ 
          email: registerUserDto.email 
        });
        userExists = !!existingUser;
    } catch (error) {
        // Se o erro NÃO for 'NOT_FOUND', significa que o serviço de usuário está com problemas.
        // Não devemos prosseguir, pois isso pode levar a registros duplicados se a falha for temporária.
        if (error.code !== 'NOT_FOUND') {
          throw new InternalServerErrorException(
            'Não foi possível verificar a existência do usuário. Tente novamente.'
          );
        }
        // Se o erro for 'NOT_FOUND', está tudo certo, o usuário não existe.
    }

    if (userExists) {
        throw new ConflictException('Usuário com este e-mail já existe.');
    }
    
    // [BUG #5 CORRIGIDO] Salt rounds do Bcrypt configurável via variável de ambiente.
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
    const hashedPassword = await bcrypt.hash(registerUserDto.password, saltRounds);

    const newUser = await this.userService.createUser({
        ...registerUserDto,
        password: hashedPassword,
    });
    
    // Retornar o usuário criado sem a senha. Jamais retorne a senha, mesmo hasheada.
    const { password, ...result } = newUser;
    return result;
  }

  /**
   * @description Simula a validação de credenciais de um usuário.
   * @param loginDto DTO com username e password.
   * @returns Um token JWT assinado.
   */
  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { username, password } = loginDto;

    // Lógica de autenticação mock.
    // Em um sistema real, isso envolveria:
    // 1. Buscar o usuário no banco de dados pelo username.
    // 2. Comparar o hash da senha fornecida com o hash armazenado (usando bcrypt).
    if (password !== 'password_segura_123') {
      // Usar a mesma mensagem de erro genérica para evitar enumeração de usuários.
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    // Mock de um usuário encontrado no banco de dados.
    const user = {
      id: `user_${username}`,
      email: `${username}@regenerabank.com`,
      roles: ['customer', 'tier-1'],
    };

    // [BUG #1 CORRIGIDO] O payload do JWT deve ser consistente com o que a Strategy espera.
    const payload = { 
      userId: user.id,
      email: user.email,
      roles: user.roles || [],
    };
    
    // Assinando o token. O segredo DEVE vir de variáveis de ambiente.
    const secret = process.env.JWT_SECRET || 'fallback-secret-para-dev-nao-usar-em-prod';
    const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });

    return { accessToken };
  }
}
