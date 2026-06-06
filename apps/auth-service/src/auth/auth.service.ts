import { AuthPrismaService } from '@app/prisma';
import { Injectable, Logger } from '@nestjs/common';
import { TokenService } from '../token/token.service';
import { RedisService } from '../redis/redis.service';
import { KafkaService } from '@app/kafka';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;

  constructor(
    private readonly prisma: AuthPrismaService,
    private tokens: TokenService,
    private redis: RedisService,
    private kafka: KafkaService,
  ) {}
}
