import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { KAFKA_SERVICE } from './constants/kafka.constants';
import { ClientKafka } from '@nestjs/microservices';
import { KafkaTopics } from './constants/kafka.constants';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);
  constructor(
    @Inject(KAFKA_SERVICE)
    private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
    this.logger.log('Kafka Producer Connected');
  }

  async emit<T>(topic: KafkaTopics, Payload: T): Promise<void> {
    await firstValueFrom(this.kafkaClient.emit(topic, Payload));
  }

  async send<TPayload, TResult>(
    topic: string,
    payload: TPayload,
  ): Promise<TResult> {
    return firstValueFrom(
      this.kafkaClient.send<TResult, TPayload>(topic, payload),
    );
  }
}
