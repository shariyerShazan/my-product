import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    EmailModule,
    NotificationModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
})
export class AppModule {}
