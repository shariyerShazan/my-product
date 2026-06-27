import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthClient } from './auth.clinet';
import { UserClient } from '../user/user.client';
import { RateLimiterService } from '../rateLimit/rateLimit.service';
import { RateLimitGuard } from '../rateLimit/guard/rate-limit.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthClient, UserClient, RateLimiterService, RateLimitGuard],
})
export class AuthModule {}
