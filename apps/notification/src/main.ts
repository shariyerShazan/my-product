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
  const httpPort = Number(process.env.NOTIFICATION_HTTP_PORT!) || 4010;
  await app.listen(httpPort);
  console.log(`🚀 Notification HTTP Server: http://localhost:${httpPort}`);
}

void bootstrap();
