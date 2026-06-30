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

// |---------------------------------------------------------------------------------------|
// |  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
// |---------------------------------------------------------------------------------------|

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../../../store/useStore';
import { openFinanceApi, neuralApi, OpenFinanceAccount, OpenFinanceTransaction } from '../../../services/api';

export function useHomeLogic() {
  const { user } = useStore();
  const [accounts, setAccounts] = useState<OpenFinanceAccount[]>([]);
  const [transactions, setTransactions] = useState<OpenFinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');

  const firstName = user?.name?.split(' ')[0] || 'Neural User';
  const totalBalance = accounts.length > 0
    ? accounts.reduce((s, a) => s + (a.balance || 0), 0)
    : 247832.90; // Default Mock

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Neural Insight
      const { data: insData } = await neuralApi.insight();
      setInsight(insData.insight || insData.summary || null);

      // 2. Open Finance Data
      const key = await AsyncStorage.getItem('prometeo_key');
      if (key) {
        const { data: accData } = await openFinanceApi.accounts(key);
        const list = accData.accounts || [];
        setAccounts(list);
        setConnected(true);

        if (list.length > 0) {
          const { data: txData } = await openFinanceApi.transactions(key, list[0].id);
          const txList = (txData.transactions || []).slice(0, 5);
          setTransactions(txList);
        }
      }
    } catch (error) {
      console.error('[HomeLogic] Neural Sync Failure:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite');
    loadData();
  }, [loadData]);

  return {
    user,
    firstName,
    totalBalance,
    accounts,
    transactions,
    loading,
    connected,
    insight,
    greeting,
    refresh: loadData,
  };
}
