import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  KAFKA_BROKERS,
  KAFKA_CLIENT_IDS,
  KAFKA_CONSUMER_GROUPS,
} from './constants/kafka.constants';
import { KafkaService } from './kafka.service';
import { KAFKA_SERVICE } from './constants/kafka.constants';

@Module({})
export class KafkaModule {
  static register(consumerGroup?: string): DynamicModule {
    return {
      module: KafkaModule,
      imports: [
        ClientsModule.register([
          {
            name: KAFKA_SERVICE,
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: KAFKA_CLIENT_IDS.MAIN,
                brokers: [KAFKA_BROKERS],
              },
              consumer: {
                groupId: consumerGroup ?? KAFKA_CONSUMER_GROUPS.MAIN,
              },
            },
          },
        ]),
      ],
      providers: [KafkaService],
      exports: [KafkaService, ClientsModule],
    };
  }
}
