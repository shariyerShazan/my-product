import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMediaStatusDto {
  @ApiProperty()
  mediaId: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  originalUrl?: string;

  @ApiPropertyOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  mediumUrl?: string;
}
