import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRedisModule } from '../redis/redis.module';
import { UserPrismaModule } from '../prisma/prisma.module';
import { UserConsumer } from './user.consumer';
import { KafkaModule } from '@app/kafka';

@Module({
  imports: [
    UserRedisModule,
    UserPrismaModule,
    KafkaModule.register('user-service'),
  ],
  controllers: [UserController, UserConsumer],
  providers: [UserService],
})
export class UserModule {}
