import { Module } from '@nestjs/common';
import { RateLimiterService } from './rateLimit.service';

@Module({
  providers: [RateLimiterService],
  exports: [RateLimiterService],
})
export class RateLimiterModule {}
