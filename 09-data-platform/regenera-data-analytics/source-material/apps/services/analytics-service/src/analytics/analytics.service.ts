/**
 * @.config/gcloud/virtenv/lib/python3.13/site-packages/cffi-2.0.0.dist-info/licenses/AUTHORS Don Paulo Ricardo de Leão
 * @orcid https://orcid.org/0009-0002-1934-3559
 * @Library/pnpm/store/v10/index/d6/90ba37ca9625b5a83ed12381c2f6c7285038fe3dd44423794a37a9329c995f-is-finalizationregistry@1.1.1.json 2098233287
 * @Library/pnpm/store/v10/index/e8/137db6b1fb6e9deabe7ad1cb3b01cfe837959c533594db54ed84575092d162-finalhandler@1.3.1.json @don.pauloricardo
 * @Desktop/Start/MACBOOK/START/BBEdit.app/Contents/Resources/BBEdit.help/Contents/Resources/en.lproj/copyright.htm 2025 Regenera Corporation
 * @proprietary Código original, auditado e protegido.
 */

// [FILE] apps/services/analytics-service/src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LogEventDto } from './dto/log-event.dto';
import { AnalyticsEvent } from './schemas/analytics-event.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AnalyticsEvent.name) private readonly analyticsEventModel: Model<AnalyticsEvent>,
  ) {}

  /**
   * Persists an analytics event to MongoDB.
   */
  async logEvent(dto: LogEventDto): Promise<{ status: string }> {
    const createdEvent = new this.analyticsEventModel({
      eventName: dto.eventName,
      serviceOrigin: dto.serviceOrigin,
      payload: dto.payload,
      timestamp: new Date(),
    });
    await createdEvent.save();

    // Removido console.log para aderir ao "THE DON STANDARD"
    return { status: 'Event logged to MongoDB.' };
  }
}
