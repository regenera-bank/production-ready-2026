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

/**
 * @meta Domain: Mobile / Security
 * @description Encrypted storage for sensitive tokens using expo-secure-store.
 */

import * as SecureStore from 'expo-secure-store';

export const SecureStoreService = {
  /**
   * Persists a sensitive value in secure storage.
   */
  async setItem(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } catch (error) {
      console.error(`Error saving key ${key} to SecureStore:`, error);
    }
  },

  /**
   * Retrieves a sensitive value from secure storage.
   */
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error retrieving key ${key} from SecureStore:`, error);
      return null;
    }
  },

  /**
   * Removes a value from secure storage.
   */
  async deleteItem(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error deleting key ${key} from SecureStore:`, error);
    }
  }
};
