import { Module } from '@nestjs/common';
import { ProtoSchemaService } from './proto-schema.service';

@Module({
  providers: [ProtoSchemaService],
  exports: [ProtoSchemaService],
})
export class ProtoSchemaModule {}
