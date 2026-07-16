import { ServiceUnavailableException } from '@nestjs/common';
import { DIDIT_KYC_WORKFLOW_ID } from './didit-workflow.config';

export interface DiditConfig {
  apiKey: string;
  baseUrl: string;
  workflowId: string;
  webhookSecret?: string;
  timeoutMs: number;
  maxRetries: number;
  sandboxScenario?: string;
}

const DEFAULT_BASE_URL = 'https://verification.didit.me';
const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MAX_RETRIES = 2;

export function readDiditConfig(requireApiKey = true): DiditConfig {
  const apiKey = process.env.DIDIT_API_KEY?.trim() ?? '';
  if (requireApiKey && !apiKey) {
    throw new ServiceUnavailableException({
      code: 'DIDIT_API_KEY_MISSING',
      message: 'Didit API key is not configured in the BFF.',
    });
  }

  const baseUrl = resolveBaseUrl(process.env.DIDIT_BASE_URL?.trim() || DEFAULT_BASE_URL);
  const workflowId =
    process.env.DIDIT_KYC_WORKFLOW_ID?.trim() || DIDIT_KYC_WORKFLOW_ID?.trim();
  if (!workflowId) {
    throw new ServiceUnavailableException({
      code: 'DIDIT_WORKFLOW_ID_MISSING',
      message: 'Didit KYC workflow id is not configured.',
    });
  }

  return {
    apiKey,
    baseUrl,
    workflowId,
    webhookSecret: process.env.DIDIT_WEBHOOK_SECRET?.trim() || undefined,
    timeoutMs: readBoundedInteger('DIDIT_REQUEST_TIMEOUT_MS', DEFAULT_TIMEOUT_MS, 1_000, 60_000),
    maxRetries: readBoundedInteger('DIDIT_MAX_RETRIES', DEFAULT_MAX_RETRIES, 0, 5),
    sandboxScenario: process.env.DIDIT_SANDBOX_SCENARIO?.trim() || undefined,
  };
}

function resolveBaseUrl(input: string): string {
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
      throw new Error('plain HTTP is forbidden in production');
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('invalid protocol');
    }
    return url.origin;
  } catch {
    throw new ServiceUnavailableException({
      code: 'DIDIT_BASE_URL_INVALID',
      message: 'Didit base URL is invalid.',
    });
  }
}

function readBoundedInteger(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ServiceUnavailableException({
      code: `${name}_INVALID`,
      message: `${name} must be an integer between ${min} and ${max}.`,
    });
  }
  return value;
}
