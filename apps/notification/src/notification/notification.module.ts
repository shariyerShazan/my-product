import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from '../notification/notification.service';
import { NotificationConsumer } from './notification.consumer';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [NotificationController, NotificationConsumer],
  providers: [NotificationService],
})
export class NotificationModule {}
