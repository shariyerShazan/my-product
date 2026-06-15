import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { EmailModule } from './email/email.module';
import { NotificationConsumer } from './notification.consumer';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [EmailModule, ConfigModule.forRoot({ isGlobal: true })],
  controllers: [NotificationController, NotificationConsumer],
  providers: [NotificationService],
})
export class NotificationModule {}
