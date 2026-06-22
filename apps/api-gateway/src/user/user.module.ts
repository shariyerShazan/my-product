import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.client';

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
