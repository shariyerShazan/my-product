import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthRedisService } from '../redis/redis.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: (): any => ({
        secret: process.env.JWT_ACCESS_SECRET!,
        signOptions: {
          expiresIn: process.env.JWT_ACCESS_EXPIRES! || '15m',
        },
      }),
    }),
  ],
  providers: [TokenService, AuthRedisService],
  exports: [TokenService],
})
export class TokenModule {}
