import { Module } from '@nestjs/common';
import { UserRedisService } from './redis.service';

@Module({
  providers: [UserRedisService],
  exports: [UserRedisService],
})
export class RedisModule {}
