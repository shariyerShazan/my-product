import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthRedisModule } from '../redis/redis.module';
import { TokenModule } from '../token/token.module';
import { KafkaModule } from '@app/kafka';
import { AuthPrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    AuthRedisModule,
    TokenModule,
    KafkaModule.register('auth-service'),
    AuthPrismaModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
