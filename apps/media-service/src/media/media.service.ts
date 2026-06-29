import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Media, MediaDocument } from '../schemas/media.schema';
import { SaveFileResult, StorageService } from '../storage/storage.service';
import { ImageService } from '../processing/image.service';
import { MediaStatus, MediaType } from '@app/common';
import { MediaRedisService } from '../redis/redis.service';

type ProtoMediaType = MediaType | string;
type ProtoMediaStatus = MediaStatus | string;

type CreateMediaDto = {
  userId: string;
  type: ProtoMediaType;
  originalName: string;
  fileName: string;
  path: string;
  originalUrl: string;
  thumbnailUrl: string;
  mediumUrl: string;
  mimeType: string;
  size: number;
  status: ProtoMediaStatus;
  width: number;
  height: number;
  duration: number;
};

type UpdateMediaStatusDto = {
  mediaId: string;
  status: ProtoMediaStatus;
  originalUrl?: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
};

const normalizeMediaType = (value: ProtoMediaType): MediaType => {
  if (Object.values(MediaType).includes(value as MediaType)) {
    return value as MediaType;
  }

  const upper = String(value).toUpperCase() as keyof typeof MediaType;
  if (upper in MediaType) {
    return MediaType[upper];
  }

  throw new Error('Invalid media type');
};

const normalizeMediaStatus = (value: ProtoMediaStatus): MediaStatus => {
  if (Object.values(MediaStatus).includes(value as MediaStatus)) {
    return value as MediaStatus;
  }

  const upper = String(value).toUpperCase() as keyof typeof MediaStatus;
  if (upper in MediaStatus) {
    return MediaStatus[upper];
  }

  throw new Error('Invalid media status');
};

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media.name)
    private readonly mediaModel: Model<MediaDocument>,
    private readonly storage: StorageService,
    private readonly imageService: ImageService,
    private readonly redis: MediaRedisService,
  ) {}

  async uploadImage(
    userId: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ) {
    if (!userId?.trim()) {
      throw new BadRequestException('userId is required to upload media.');
    }

    await this.imageService.validate(buffer, mimeType);

    const processed = await this.imageService.process(buffer);

    let original: SaveFileResult | undefined;

    let medium: SaveFileResult | undefined;

    let thumbnail: SaveFileResult | undefined;

    try {
      [original, medium, thumbnail] = await Promise.all([
        this.storage.saveFile({
          folder: 'images',
          userId,
          variant: 'original',
          extension: processed.extension,
          buffer: processed.original,
        }),

        this.storage.saveFile({
          folder: 'images',
          userId,
          variant: 'medium',
          extension: processed.extension,
          buffer: processed.medium,
        }),

        this.storage.saveFile({
          folder: 'images',
          userId,
          variant: 'thumbnail',
          extension: processed.extension,
          buffer: processed.thumbnail,
        }),
      ]);

      const media = await this.mediaModel.create({
        userId,

        type: MediaType.IMAGE,

        originalName,

        fileName: original.fileName,

        path: original.relativePath,

        originalUrl: original.relativePath,

        thumbnailUrl: thumbnail.relativePath,

        mediumUrl: medium.relativePath,

        mimeType: processed.mimeType,

        size: processed.size,

        width: processed.width,

        height: processed.height,

        status: MediaStatus.DONE,
      });

      await this.redis.setMedia(media.id, media.toObject());

      return {
        success: true,

        message: 'Image uploaded successfully.',

        media,
      };
    } catch (error) {
      await Promise.all([
        original
          ? this.storage.deleteFile(original.relativePath)
          : Promise.resolve(),

        medium
          ? this.storage.deleteFile(medium.relativePath)
          : Promise.resolve(),

        thumbnail
          ? this.storage.deleteFile(thumbnail.relativePath)
          : Promise.resolve(),
      ]);

      throw error;
    }
  }

  async createMedia(dto: CreateMediaDto) {
    const media = await this.mediaModel.create({
      ...dto,
      type: normalizeMediaType(dto.type),
      status: normalizeMediaStatus(dto.status),
    });
    await this.redis.setMedia(media.id, media.toObject());

    return {
      success: true,
      message: 'Media created successfully.',
      media,
    };
  }

  async getMedia(mediaId: string) {
    const cached = await this.redis.getMedia<Media>(mediaId);

    if (cached) {
      return {
        success: true,
        message: 'Media fetched successfully.',
        media: cached,
      };
    }
    const media = await this.mediaModel.findById(mediaId);

    if (!media) {
      throw new NotFoundException('Media not found.');
    }
    await this.redis.setMedia(media.id, media.toObject());

    return {
      success: true,
      message: 'Media fetched successfully.',
      media,
    };
  }

  async listUserMedia(
    userId: string,
    type: string,
    page: number,
    limit: number,
  ) {
    const filter: { userId: string; isDeleted: boolean; type?: MediaType } = {
      userId,
      isDeleted: false,
    };

    if (type && type !== 'all') {
      filter.type = normalizeMediaType(type);
    }

    const skip = (page - 1) * limit;

    const [media, total] = await Promise.all([
      this.mediaModel
        .find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      this.mediaModel.countDocuments(filter),
    ]);

    return {
      success: true,
      message: 'Media fetched successfully.',
      media,
      total,
      page,
      limit,
    };
  }

  async deleteMedia(mediaId: string, userId: string) {
    const media = await this.mediaModel.findOne({
      _id: mediaId,
      userId,
    });

    if (!media) {
      throw new NotFoundException('Media not found.');
    }

    media.isDeleted = true;
    media.deletedAt = new Date();

    await media.save();
    await this.redis.deleteMedia(media.id);

    return {
      success: true,
      message: 'Media deleted successfully.',
    };
  }

  async exists(mediaId: string) {
    const exists = await this.mediaModel.exists({
      _id: mediaId,
      isDeleted: false,
    });

    return {
      success: true,
      message: 'Checked successfully.',
      exists: !!exists,
    };
  }

  async updateMediaStatus(dto: UpdateMediaStatusDto) {
    const media = await this.mediaModel.findById(dto.mediaId);

    if (!media) {
      throw new NotFoundException();
    }

    Object.assign(media, {
      ...dto,
      status: normalizeMediaStatus(dto.status),
    });

    await media.save();
    await this.redis.deleteMedia(media.id);

    return {
      success: true,
      message: 'Status updated successfully.',
      media,
    };
  }

  async getMediaByPath(path: string) {
    const media = await this.mediaModel.findOne({
      path,
      isDeleted: false,
    });

    if (!media) {
      throw new NotFoundException();
    }
    await this.redis.setMedia(media.id, media.toObject());
    return {
      success: true,
      message: 'Media fetched successfully.',
      media,
    };
  }

  async getMediaByIds(mediaIds: string[]) {
    const ids = [...new Set(mediaIds.filter(Boolean))];

    if (!ids.length) {
      return {
        success: true,
        message: 'No media found.',
        media: [],
      };
    }

    const result: Media[] = [];

    const missingIds: string[] = [];

    for (const id of ids) {
      const cached = await this.redis.getMedia<Media>(id);

      if (cached) {
        result.push(cached);
      } else {
        missingIds.push(id);
      }
    }

    if (missingIds.length) {
      const medias = await this.mediaModel.find({
        _id: {
          $in: missingIds,
        },
        isDeleted: false,
        status: MediaStatus.DONE,
      });

      for (const media of medias) {
        const plain = media.toObject();

        await this.redis.setMedia(media.id, plain);

        result.push(plain);
      }
    }

    return {
      success: true,
      message: 'Media fetched successfully.',
      media: result,
    };
  }
}
