/**
 * @meta Domain: Mobile / Security
 * @description SSL Pinning configuration for API requests.
 */

import { fetch } from 'react-native-ssl-pinning';

export const secureFetch = (url: string, options: any) => {
  return fetch(url, {
    ...options,
    sslPinning: {
      certs: ['regenera_api_cert'], // Must be in native assets
    },
  });
};
