import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GrpcExceptionFilter } from '@app/common';
import { AppModule } from './app.module';

const grpcPort = Number(process.env.AUTH_GRPC_PORT) || 3001;
const httpPort = Number(process.env.AUTH_HTTP_PORT) || 4001;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(process.cwd(), 'libs/proto-schema/src/proto/auth.proto'),
      url: `0.0.0.0:${grpcPort}`,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  app.useGlobalFilters(new GrpcExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      stopAtFirstError: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  await app.startAllMicroservices();
  await app.listen(httpPort);
  console.log(`🚀 Auth HTTP Server: http://localhost:${httpPort}`);
  console.log(`🚀 Auth gRPC Server: 0.0.0.0:${grpcPort}`);
}
void bootstrap();
