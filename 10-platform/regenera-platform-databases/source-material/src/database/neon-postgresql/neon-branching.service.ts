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

import axios from 'axios';

export class NeonBranchingService {
  private readonly apiKey = process.env.NEON_API_KEY;
  private readonly projectId = process.env.NEON_PROJECT_ID;
  private readonly baseUrl = 'https://console.neon.tech/api/v2';

  async createTestBranch(branchName: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/projects/${this.projectId}/branches`,
        { branch: { name: branchName } },
        { headers: { Authorization: `Bearer ${this.apiKey}` } },
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create Neon branch:', error);
      throw error;
    }
  }

  async deleteBranch(branchId: string) {
    await axios.delete(
      `${this.baseUrl}/projects/${this.projectId}/branches/${branchId}`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      },
    );
  }
}
