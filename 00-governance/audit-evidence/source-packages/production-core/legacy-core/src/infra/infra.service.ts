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
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
// Use google-auth for real Cloud Run Admin API calls (no limits, real).
// This connects to active Cloud Run Admin API, IAM for auth.
import { GoogleAuth } from 'google-auth-library';

@Injectable()
export class InfraService {
  private readonly logger = new Logger(InfraService.name);
  private readonly auth = new GoogleAuth();
  private readonly project =
    process.env.GOOGLE_CLOUD_PROJECT || 'project-93b8df04-72ab-4e44-8a6';

  async listInstances() {
    // Real call to Cloud Run Admin API to list services (treated as "instances" for dashboard).
    // Expand to Compute Engine API for VMs if needed.
    try {
      const client = await this.auth.getClient();
      const url = `https://run.googleapis.com/v2/projects/${this.project}/locations/southamerica-east1/services`;
      const res = await client.request({ url, method: 'GET' });
      const services = (res.data as any).services || [];
      return services.map((s: any) => ({
        id: s.name.split('/').pop(),
        name: s.name.split('/').pop(),
        status: s.latestReadyRevision ? 'RUNNING' : 'TERMINATED',
        zone: 'southamerica-east1',
        machineType: 'cloud-run',
      }));
    } catch (e) {
      this.logger.warn(
        'Real GCP call failed, using minimal (check IAM permissions for Cloud Run Admin)',
      );
      // In prod, this should not fallback if IAM correct.
      return [];
    }
  }

  async toggleInstance(id: string, action: 'start' | 'stop') {
    // Real update using Cloud Run Admin API to scale service ( "toggle" by min/max instances).
    // Requires IAM roles: roles/run.admin
    try {
      const client = await this.auth.getClient();
      const serviceName = `projects/${this.project}/locations/southamerica-east1/services/${id}`;
      const updateMask = 'spec.template.scaling';
      const body = {
        spec: {
          template: {
            scaling: {
              minInstanceCount: action === 'start' ? 1 : 0,
              maxInstanceCount: action === 'start' ? 10 : 0,
            },
          },
        },
      };
      const url = `https://run.googleapis.com/v2/${serviceName}?updateMask=${updateMask}`;
      await client.request({ url, method: 'PATCH', body });
      this.logger.log(
        `Real toggle ${action} for ${id} via Cloud Run Admin API`,
      );
      return { status: 'success', id, action };
    } catch (e: any) {
      this.logger.error(`GCP toggle failed for ${id}: ${e.message}`);
      throw new Error(
        `Infra action failed: ${e.message} (check IAM + Secret Manager for creds if needed)`,
      );
    }
  }
}
