/**
 * @meta Domain: Mobile / Biometrics
 * @description Checks hardware support for biometrics.
 */

import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export const checkBiometricHardware = async () => {
  const { available, biometryType } = await rnBiometrics.isSensorAvailable();
  return { available, biometryType };
};
