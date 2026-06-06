import { Module } from '@nestjs/common';
import { AuthPrismaService } from './services/auth-prisma.service';

@Module({
  providers: [AuthPrismaService],
  exports: [AuthPrismaService],
})
export class PrismaModule {}
