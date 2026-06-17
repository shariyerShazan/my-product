import { Module } from '@nestjs/common';
import { AuthRedisService } from './redis.service';

@Module({
  providers: [AuthRedisService],
  exports: [AuthRedisService],
})
export class RedisModule {}
