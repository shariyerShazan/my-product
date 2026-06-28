import { BadRequestException, Injectable } from '@nestjs/common';

import sharp from 'sharp';

export interface ProcessedImage {
  original: Buffer;
  medium: Buffer;
  thumbnail: Buffer;

  width: number;
  height: number;

  size: number;

  extension: string;
  mimeType: string;
}

@Injectable()
export class ImageService {
  /**
   * Supported mime types
   */
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  /**
   * Validate uploaded image
   */
  async validate(buffer: Buffer, mimeType: string): Promise<void> {
    if (!this.allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException('Unsupported image type.');
    }

    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException('Invalid image.');
    }

    if (metadata.width < 10 || metadata.height < 10) {
      throw new BadRequestException('Image is too small.');
    }
  }

  /**
   * Process image
   *
   * Every uploaded image becomes WebP.
   */
  async process(buffer: Buffer): Promise<ProcessedImage> {
    const metadata = await sharp(buffer).metadata();

    const pipeline = sharp(buffer).rotate();

    /**
     * Original
     */
    const original = await pipeline
      .clone()
      .webp({
        quality: 85,
      })
      .toBuffer();

    /**
     * Medium
     */
    const medium = await pipeline
      .clone()
      .resize({
        width: 800,
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
      })
      .toBuffer();

    /**
     * Thumbnail
     */
    const thumbnail = await pipeline
      .clone()
      .resize(200, 200, {
        fit: 'cover',
      })
      .webp({
        quality: 80,
      })
      .toBuffer();

    return {
      original,
      medium,
      thumbnail,

      width: metadata.width ?? 0,
      height: metadata.height ?? 0,

      size: original.length,

      extension: 'webp',

      mimeType: 'image/webp',
    };
  }

  /**
   * Avatar
   */
  async processAvatar(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .rotate()
      .resize(400, 400, {
        fit: 'cover',
      })
      .webp({
        quality: 85,
      })
      .toBuffer();
  }

  /**
   * Cover
   */
  async processCover(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .rotate()
      .resize(1200, 400, {
        fit: 'cover',
      })
      .webp({
        quality: 85,
      })
      .toBuffer();
  }
}
