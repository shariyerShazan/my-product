import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { UserRedisModule } from '../redis/redis.module';
import { KafkaModule } from '@app/kafka';
import { PrismaModule } from '@app/prisma';

@Module({
  imports: [
    JwtModule.register({ global: true }),
    ConfigModule.forRoot({ isGlobal: true }),
    UserRedisModule,
    KafkaModule.register('user-service'),
    PrismaModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
