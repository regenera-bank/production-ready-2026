import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { ApiProductEntity } from './api-product.entity';

@Entity('api_subscriptions')
export class ApiSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  partnerId: string;

  @ManyToOne(() => ApiProductEntity)
  product: ApiProductEntity;

  @Column('uuid')
  productId: string;

  @Column()
  apiKeyHash: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ nullable: true })
  lastUsedAt: Date;

  @Column({ nullable: true })
  revokedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
