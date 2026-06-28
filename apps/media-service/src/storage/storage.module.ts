import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageService } from './LocalStorageService';

@Module({
  providers: [
    {
      provide: StorageService,
      useClass: LocalStorageService,
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
