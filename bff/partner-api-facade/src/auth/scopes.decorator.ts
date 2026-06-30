import { SetMetadata } from '@nestjs/common';

export const SCOPES_KEY = 'partner:scopes';
export const RequireScopes = (...scopes: string[]) => SetMetadata(SCOPES_KEY, scopes);