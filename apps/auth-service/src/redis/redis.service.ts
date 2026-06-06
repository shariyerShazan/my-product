import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      retryStrategy: (times) => Math.min(times * 200, 3000),
    });
  }

  async blacklistToken(token: string, ttlsec: number) {
    await this.client.set(`blocklist:${token}`, '1', 'EX', ttlsec);
  }

  async isBlackListed(token: string): Promise<boolean> {
    const result = await this.client.get(`blocklist:${token}`);
    return result !== null;
  }

  async saveRefreshToken(token: string, userId: string, ttlsec: number) {
    await this.client.set(`refresh:${userId}`, token, 'EX', ttlsec);
  }

  async getRefreshToken(userId: string): Promise<string | null> {
    const token = await this.client.get(`refresh:${userId}`);
    return token;
  }

  async deleteRefreshToken(userId: string) {
    await this.client.del(`refresh:${userId}`);
  }

  async incrementLoginAttempts(email: string): Promise<number> {
    const key = `login:attempt:${email}`;
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, 900);
    }
    return count;
  }

  async getLoginAttempts(email: string): Promise<number> {
    const val = await this.client.get(`login:attempt:${email}`);
    return Number(val || '0');
  }

  async resetLoginAttempts(email: string) {
    await this.client.del(`login:attempts:${email}`);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
