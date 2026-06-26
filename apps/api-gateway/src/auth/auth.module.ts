import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthClient } from './auth.clinet';
import { UserClient } from '../user/user.client';

@Module({
  controllers: [AuthController],
  providers: [AuthClient, UserClient],
})
export class AuthModule {}
