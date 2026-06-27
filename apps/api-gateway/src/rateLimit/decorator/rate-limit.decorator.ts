import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate_limit';

export enum RateLimitKeyType {
  IP = 'ip',
  IP_EMAIL = 'ip_email',
  USER_ID = 'userId',
  IP_USER_ID = 'ip_userId',
}

export interface RateLimitOptions {
  limit: number;
  window: number;
  key?: RateLimitKeyType;
}

export const RateLimit = (
  limit: number,
  window: number,
  options?: { key?: RateLimitKeyType },
) =>
  SetMetadata(RATE_LIMIT_KEY, {
    limit,
    window,
    key: options?.key ?? RateLimitKeyType.IP,
  });
