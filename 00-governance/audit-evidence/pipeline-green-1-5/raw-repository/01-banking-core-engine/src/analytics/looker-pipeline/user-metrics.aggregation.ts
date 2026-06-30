/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

import { Injectable, Logger } from '@nestjs/common';
import { BigQueryProvider } from '../bigquery-stream/bigquery.provider';

@Injectable()
export class UserMetricsAggregator {
  private readonly logger = new Logger(UserMetricsAggregator.name);

  constructor(private readonly bq: BigQueryProvider) {}

  async aggregateDailyEngagement() {
    this.logger.log('Starting Daily Engagement Aggregation...');

    const query = `
      INSERT INTO \`regenera_analytics.daily_engagement\`
      (event_date, active_users, total_sessions)
      SELECT 
        CURRENT_DATE() as event_date,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_sessions
      FROM \`regenera_audit.user_activity\`
      WHERE DATE(timestamp) = CURRENT_DATE()
    `;

    try {
      await this.bq.getClient().query(query);
      this.logger.log('Aggregation complete.');
    } catch (error) {
      this.logger.error('Aggregation failed', error.stack);
    }
  }
}
