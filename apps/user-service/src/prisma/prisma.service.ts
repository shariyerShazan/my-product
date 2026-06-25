import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/user-client';

@Injectable()
export class UserPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  [x: string]: any;
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.USER_DB_PRIMARY_URL!,
    });
    super({ adapter });
  }
  async onModuleInit() {
    await this.$connect();
    console.log('User Prisma connected');
  }
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('User Prisma disconnected');
  }
}
