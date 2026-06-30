import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { ApiProductEntity } from './entities/api-product.entity';
import { ApiSubscriptionEntity } from './entities/api-subscription.entity';

@Injectable()
export class DeveloperPortalService {
  constructor(
    @InjectRepository(ApiProductEntity)
    private readonly productRepo: Repository<ApiProductEntity>,
    @InjectRepository(ApiSubscriptionEntity)
    private readonly subscriptionRepo: Repository<ApiSubscriptionEntity>,
  ) {}

  async createProduct(
    name: string,
    scopes: string[],
    rateLimit = 100,
    allowedIps?: string[],
  ) {
    const product = this.productRepo.create({
      name,
      scopes,
      rateLimit,
      allowedIps,
    });
    return this.productRepo.save(product);
  }

  async generateApiKey(
    partnerId: string,
    productId: string,
    createdBy?: string,
  ) {
    const rawSecret = randomBytes(24).toString('hex');
    const apiKeyHash = await argon2.hash(rawSecret);

    const subscription = this.subscriptionRepo.create({
      partnerId,
      productId,
      apiKeyHash,
      createdBy,
    });
    await this.subscriptionRepo.save(subscription);

    const rawKey = `rg_live_${subscription.id}_${rawSecret}`;
    return { subscriptionId: subscription.id, rawKey };
  }

  async validateApiKey(rawKey: string): Promise<ApiSubscriptionEntity> {
    const parts = rawKey.split('_');
    if (parts.length !== 4 || parts[0] !== 'rg' || parts[1] !== 'live') {
      throw new UnauthorizedException('Invalid API Key format');
    }

    const subscriptionId = parts[2];
    const rawSecret = parts[3];

    const sub = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
      relations: ['product'],
    });

    if (!sub || sub.revokedAt || !sub.product.active) {
      throw new UnauthorizedException('API Key invalid or revoked');
    }

    const isValid = await argon2.verify(sub.apiKeyHash, rawSecret);
    if (!isValid) {
      throw new UnauthorizedException('Invalid API Key');
    }

    sub.lastUsedAt = new Date();
    this.subscriptionRepo.save(sub).catch(() => {}); // Fire and forget for performance

    return sub;
  }

  async revokeKey(subscriptionId: string) {
    const sub = await this.subscriptionRepo.findOne({
      where: { id: subscriptionId },
    });
    if (sub) {
      sub.revokedAt = new Date();
      await this.subscriptionRepo.save(sub);
    }
  }
}
