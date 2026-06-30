/**
 * @meta Domain: Mobile / Security
 * @description Detection for rooted or jailbroken devices.
 */

import JailMonkey from 'jail-monkey';

export const checkDeviceIntegrity = () => {
  const isJailBroken = JailMonkey.isJailBroken();
  const canMockLocation = JailMonkey.canMockLocation();
  
  if (isJailBroken || canMockLocation) {
    console.warn('Device integrity compromised');
    return false;
  }
  return true;
};
