import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@app/common';
import * as Express from 'express';
import { MediaClient } from './media.client';

@ApiTags('Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaClient: MediaClient) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  create(@Req() req: Express.Request, @Body() dto: any) {
    return this.mediaClient.createMedia({
      ...dto,
      userId: req.user.userId,
    });
  }

  @Get(':mediaId')
  getMedia(@Param('mediaId') mediaId: string) {
    return this.mediaClient.getMedia(mediaId);
  }

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  list(
    @Req() req: Express.Request,
    @Query('type') type = '',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.mediaClient.listUserMedia(
      req.user.userId,
      type,
      Number(page),
      Number(limit),
    );
  }

  @Delete(':mediaId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  remove(@Req() req: Express.Request, @Param('mediaId') mediaId: string) {
    return this.mediaClient.deleteMedia(mediaId, req.user.userId);
  }

  @Patch(':mediaId/status')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  updateStatus(@Param('mediaId') mediaId: string, @Body() dto: any) {
    return this.mediaClient.updateMediaStatus({
      mediaId,
      ...dto,
    });
  }

  @Get(':mediaId/exists')
  exists(@Param('mediaId') mediaId: string) {
    return this.mediaClient.exists(mediaId);
  }
}
