import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaGrpcController } from './media.grpc.controller';
import { MediaService } from './media.service';
import { Media, MediaSchema } from '../schemas/media.schema';
import { StorageModule } from '../storage/storage.module';
import { ProcessingModule } from '../processing/processing.module';
import { MediaRedisService } from '../redis/redis.service';
import { MediaHttpController } from './media.http.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Media.name,
        schema: MediaSchema,
      },
    ]),
    StorageModule,
    ProcessingModule,
  ],
  controllers: [MediaGrpcController, MediaHttpController],
  providers: [MediaService, MediaRedisService],
  exports: [MediaService, MongooseModule],
})
export class MediaModule {}
