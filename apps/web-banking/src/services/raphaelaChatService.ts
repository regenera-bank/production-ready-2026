
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { AssistantReply, AssistantSettings } from '../types';
import {
  BffError,
  chatWithRaphaelaViaBff,
  speakWithRaphaelaViaBff,
} from '../platform/bff-client';

export const chatWithRaphaela = async (
  userMessage: string,
  currentContext: string,
  _settings: AssistantSettings,
  accessToken: string,
): Promise<AssistantReply> => {
  try {
    const dto = await chatWithRaphaelaViaBff(accessToken, userMessage, currentContext);
    return {
      text: dto.text,
      action: dto.action as AssistantReply['action'],
      params: dto.params,
      searchResults: dto.searchResults,
      mapResults: dto.mapResults as AssistantReply['mapResults'],
    };
  } catch (error) {
    console.error('Raphaela indisponível:', error);
    const detail =
      error instanceof BffError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'erro desconhecido';
    return {
      text: `Raphaela indisponível: ${detail}`,
      action: 'none',
    };
  }
};

export const speakWithRaphaela = async (
  text: string,
  voiceName: string,
  accessToken: string,
): Promise<string | null> => {
  try {
    return await speakWithRaphaelaViaBff(accessToken, text, voiceName);
  } catch (error) {
    console.error('Síntese de voz indisponível:', error);
    return null;
  }
};