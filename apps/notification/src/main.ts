import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { Transport } from '@nestjs/microservices';
import {
  KAFKA_BROKERS,
  KAFKA_CLIENT_ID,
  KAFKA_CONSUMER_GROUP,
} from '@app/kafka';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Notification');
  const app = await NestFactory.create(NotificationModule);

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: KAFKA_CLIENT_ID,
        brokers: [KAFKA_BROKERS],
      },
      consumer: {
        groupId: KAFKA_CONSUMER_GROUP,
      },
    },
  });

  await app.startAllMicroservices();
  const port = Number(process.env.NOTIFICATION_PORT!) || 3010;
  await app.listen(port);
  logger.log(
    `Notification Service running on port ${process.env.NOTIFICATION_PORT || 3010}`,
  );
}

bootstrap();
