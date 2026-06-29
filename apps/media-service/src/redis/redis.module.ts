import { Module } from '@nestjs/common';
import { MediaRedisService } from './redis.service';

@Module({
  providers: [MediaRedisService],
  exports: [MediaRedisService],
})
export class MediaRedisModule {}
