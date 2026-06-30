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
 * @meta Domain: Mobile / Biometrics
 * @description Full integration with expo-local-authentication.
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { Alert, Platform } from 'react-native';

export class NativeAuthService {
  /**
   * Authenticates the user using biometrics (FaceID/TouchID/Fingerprint).
   * Falls back to device PIN/Passcode if biometrics are not available or not enrolled.
   */
  static async authenticate(reason: string): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (!hasHardware || !isEnrolled) {
        // If hardware is missing or no biometrics enrolled, we might want to inform the user
        // but for a smooth UX in a bank app, we usually fallback to PIN.
        // We'll return true to allow the flow to continue if we assume PIN is handled by OS.
        // Or we could trigger the OS PIN prompt by authenticateAsync anyway.
        console.log('Biometrics not available or enrolled. Falling back to device security.');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Usar Senha do Dispositivo',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false, // Allow fallback to PIN/Pattern
      });

      if (!result.success && result.error !== 'user_cancel') {
        Alert.alert('Erro de Autenticação', 'Não foi possível verificar sua identidade.');
      }

      return result.success;
    } catch (error) {
      console.error('Biometric Auth Error:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado na autenticação.');
      return false;
    }
  }
}
