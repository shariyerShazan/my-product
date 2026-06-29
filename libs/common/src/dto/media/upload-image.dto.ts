import { ApiProperty } from '@nestjs/swagger';

export class UploadImageDto {
  @ApiProperty()
  userId: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
  })
  file: any;
}
