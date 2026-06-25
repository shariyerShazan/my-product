import { Module } from '@nestjs/common';
import { AtuhPrismaService } from './prisma.service';

@Module({
  providers: [AtuhPrismaService],
  exports: [AtuhPrismaService],
})
export class AuthPrismaModule {}
