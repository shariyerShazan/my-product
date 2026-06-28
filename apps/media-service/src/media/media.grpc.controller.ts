import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { MediaService } from './media.service';
import { MediaStatus, MediaType } from '@app/common';

type CreateMediaRequest = {
  userId: string;
  type: MediaType | string;
  originalName: string;
  fileName: string;
  path: string;
  originalUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  mimeType: string;
  size: number;
  status: MediaStatus | string;
  width: number;
  height: number;
  duration: number;
};

type GetMediaRequest = { mediaId: string };

type ListUserMediaRequest = {
  userId: string;
  type: string;
  page: number;
  limit: number;
};

type DeleteMediaRequest = { mediaId: string; userId: string };

type ExistsRequest = { mediaId: string };

type UpdateMediaStatusRequest = {
  mediaId: string;
  status: MediaStatus | string;
  originalUrl?: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
};

type GetMediaByPathRequest = { path: string };

@Controller()
export class MediaGrpcController {
  constructor(private readonly mediaService: MediaService) {}

  @GrpcMethod('MediaService', 'CreateMedia')
  createMedia(data: CreateMediaRequest) {
    return this.mediaService.createMedia(data);
  }

  @GrpcMethod('MediaService', 'GetMedia')
  getMedia(data: GetMediaRequest) {
    return this.mediaService.getMedia(data.mediaId);
  }

  @GrpcMethod('MediaService', 'ListUserMedia')
  listUserMedia(data: ListUserMediaRequest) {
    return this.mediaService.listUserMedia(
      data.userId,
      data.type,
      data.page,
      data.limit,
    );
  }

  @GrpcMethod('MediaService', 'DeleteMedia')
  deleteMedia(data: DeleteMediaRequest) {
    return this.mediaService.deleteMedia(data.mediaId, data.userId);
  }

  @GrpcMethod('MediaService', 'Exists')
  exists(data: ExistsRequest) {
    return this.mediaService.exists(data.mediaId);
  }

  @GrpcMethod('MediaService', 'UpdateMediaStatus')
  updateMediaStatus(data: UpdateMediaStatusRequest) {
    return this.mediaService.updateMediaStatus(data);
  }

  @GrpcMethod('MediaService', 'GetMediaByPath')
  getMediaByPath(data: GetMediaByPathRequest) {
    return this.mediaService.getMediaByPath(data.path);
  }
}
