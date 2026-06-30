import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccountEntity } from '../../src/core/entities/account.entity';
import { Repository } from 'typeorm';

describe('Pix Flow (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let accountRepo: Repository<AccountEntity>;
  let token: string;
  const senderNeuralId = 'usr_sender_e2e';
  const receiverNeuralId = 'usr_receiver_e2e';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    jwtService = app.get<JwtService>(JwtService);
    accountRepo = app.get(getRepositoryToken(AccountEntity));

    // Prepare accounts
    await accountRepo.delete({ neuralId: senderNeuralId });
    await accountRepo.delete({ neuralId: receiverNeuralId });

    await accountRepo.save(
      accountRepo.create({
        neuralId: senderNeuralId,
        balanceCents: 5000,
        accountNumber: 'sender-123',
      }),
    );
    await accountRepo.save(
      accountRepo.create({
        neuralId: receiverNeuralId,
        balanceCents: 0,
        accountNumber: 'receiver-456',
      }),
    );

    token = jwtService.sign({
      sub: senderNeuralId,
      neuralId: senderNeuralId,
      roles: ['USER'],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('deve realizar Pix Inbound e debitar do pagador', async () => {
    const idempotencyKey = 'idem-inbound-1';
    const request = require('supertest');
    await request(app.getHttpServer())
      .post('/pix/transfer')
      .set('Authorization', `Bearer ${token}`)
      .set('idempotency-key', idempotencyKey)
      .send({
        key: 'receiver@example.com',
        amount: 10, // R$ 10,00
      })
      .expect(201);

    const sender = await accountRepo.findOne({
      where: { neuralId: senderNeuralId } as any,
    });
    expect(Number(sender.balanceCents)).toBe(4000);
  });

  it('deve rejeitar Pix duplicado com mesma chave de idempotência', async () => {
    const idempotencyKey = 'idem-inbound-1'; // Same key
    const request = require('supertest');
    await request(app.getHttpServer())
      .post('/pix/transfer')
      .set('Authorization', `Bearer ${token}`)
      .set('idempotency-key', idempotencyKey)
      .send({
        key: 'receiver@example.com',
        amount: 10,
      })
      .expect(200); // Idempotency returns OK, but doesn't debit

    const sender = await accountRepo.findOne({
      where: { neuralId: senderNeuralId } as any,
    });
    expect(Number(sender.balanceCents)).toBe(4000); // Saldo continua 4000
  });

  it('deve realizar rollback (erro) por saldo insuficiente', async () => {
    const idempotencyKey = 'idem-inbound-2';
    const request = require('supertest');
    await request(app.getHttpServer())
      .post('/pix/transfer')
      .set('Authorization', `Bearer ${token}`)
      .set('idempotency-key', idempotencyKey)
      .send({
        key: 'receiver@example.com',
        amount: 100, // R$ 100,00 (maior que 40)
      })
      .expect(422); // Unprocessable Entity / Insufficient funds

    const sender = await accountRepo.findOne({
      where: { neuralId: senderNeuralId } as any,
    });
    expect(Number(sender.balanceCents)).toBe(4000); // Saldo preservado
  });
});
