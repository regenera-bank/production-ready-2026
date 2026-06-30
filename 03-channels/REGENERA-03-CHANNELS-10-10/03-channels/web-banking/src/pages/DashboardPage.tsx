import React from 'react';
import { AppLayout } from '@/design-system/AppLayout';
import { HomeScreen } from '@/features/account-banking/ui/HomeScreen';

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