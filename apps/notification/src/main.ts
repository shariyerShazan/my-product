import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import {
  KAFKA_BROKERS,
  KAFKA_CLIENT_IDS,
  KAFKA_CONSUMER_GROUPS,
} from '@app/kafka';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: KAFKA_CLIENT_IDS.NOTIFICATION,
        brokers: [KAFKA_BROKERS],
      },
      consumer: {
        groupId: KAFKA_CONSUMER_GROUPS.NOTIFICATION,
      },
    },
  });

  await app.startAllMicroservices();
  const port = Number(process.env.NOTIFICATION_PORT!) || 3010;
  await app.listen(port);
  console.log(`🚀 Notification server is running on: http://localhost:${port}`);
}

bootstrap();
