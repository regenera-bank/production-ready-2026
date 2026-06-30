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

import React from 'react';
import { AppLayout } from '../shared/ui/AppLayout';
import { HomeScreen } from '../features/banking/ui/HomeScreen';

const DashboardPage: React.FC = () => {
  return (
    <AppLayout>
      <div className="animate-in slide-in-from-bottom-4 duration-700">
        <HomeScreen />
      </div>
    </AppLayout>
  );
};

export default DashboardPage;