import { Module } from '@nestjs/common';
import { MediaClient } from './media.client';
import { MediaController } from './media.controller';

@Module({
  providers: [MediaClient],
  exports: [MediaClient],
  controllers: [MediaController],
})
export class MediaModule {}
