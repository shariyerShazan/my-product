import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Shariyer Shazan',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Backend Engineer | Node.js | Microservices',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    example: 'uuid',
  })
  @IsOptional()
  @IsString()
  avatarMediaId?: string;

  @ApiPropertyOptional({
    example: 'uuid',
  })
  @IsOptional()
  @IsString()
  coverMediaId?: string;

  @ApiPropertyOptional({
    example: 'Dhaka, Bangladesh',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    example: 'https://shazan.dev',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    example: '2004-01-01',
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
