import { Module } from '@nestjs/common';
import { AuthPrismaService } from './prisma-services/auth-prisma.service';
import { UserPrismaService } from './prisma-services/user-prisma.service';

@Module({
  providers: [AuthPrismaService, UserPrismaService],
  exports: [AuthPrismaService, UserPrismaService],
})
export class PrismaModule {}
