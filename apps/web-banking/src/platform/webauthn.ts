import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import { mapWebAuthnError } from './webauthn-errors';
import {
  fetchPasskeyLoginOptions,
  fetchPasskeyRegisterOptions,
  fetchPasskeyRegisterOptionsMe,
  SessionResponse,
  verifyPasskeyLogin,
  verifyPasskeyRegister,
  verifyPasskeyRegisterMe,
} from './bff-client';

export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

export const registerTouchId = async (
  document: string,
  password: string,
): Promise<SessionResponse> => {
  try {
    const options = await fetchPasskeyRegisterOptions(document, password);
    const response = await startRegistration({ optionsJSON: options });
    return verifyPasskeyRegister(document, response);
  } catch (error) {
    throw new Error(mapWebAuthnError(error));
  }
};

export const registerTouchIdForSession = async (
  accessToken: string,
): Promise<{ enrolled: true }> => {
  const options = await fetchPasskeyRegisterOptionsMe(accessToken);
  const response = await startRegistration({ optionsJSON: options });
  return verifyPasskeyRegisterMe(accessToken, response);
};

export const loginWithTouchId = async (document: string): Promise<SessionResponse> => {
  try {
    const options = await fetchPasskeyLoginOptions(document);
    const response = await startAuthentication({ optionsJSON: options });
    return verifyPasskeyLogin(document, response);
  } catch (error) {
    throw new Error(mapWebAuthnError(error));
  }
};