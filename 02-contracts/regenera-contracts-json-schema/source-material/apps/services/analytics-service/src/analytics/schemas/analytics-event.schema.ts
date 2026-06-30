/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Analytics Event Schema
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/analytics-service/src/analytics/schemas/analytics-event.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnalyticsEventDocument = HydratedDocument<AnalyticsEvent>;

@Schema({ timestamps: true })
export class AnalyticsEvent {
  @Prop({ required: true, index: true })
  eventName: string;

  @Prop({ required: true })
  serviceOrigin: string;

  @Prop({ type: Object })
  payload: Record<string, any>;

  @Prop({ required: true, index: true })
  timestamp: Date;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);
