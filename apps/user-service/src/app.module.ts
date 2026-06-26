// import { KafkaModule } from '@app/kafka';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserPrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { UserRedisModule } from './redis/redis.module';

@Module({
  imports: [
    UserPrismaModule,
    UserModule,
    UserRedisModule,
    JwtModule.register({ global: true }),
    ConfigModule.forRoot({ isGlobal: true }),
  ],
})
export class AppModule {}
