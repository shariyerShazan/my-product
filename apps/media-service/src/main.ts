import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { join } from 'path';
import { GrpcExceptionFilter } from '@app/common';
import { AppModule } from './app.module';

const grpcPort = Number(process.env.MEDIA_GRPC_PORT) || 3009;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.connectMicroservice({
    transport: Transport.GRPC,
    options: {
      package: 'media',
      protoPath: join(process.cwd(), 'libs/proto-schema/src/proto/media.proto'),
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

  await app.listen(grpcPort);
  console.log(`Media server is running on: http://localhost:${grpcPort}`);
}
void bootstrap();
