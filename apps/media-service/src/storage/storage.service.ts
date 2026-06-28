import { Readable } from 'stream';

export type StorageFolder = 'images' | 'videos' | 'avatars' | 'covers';

export type StorageVariant = 'original' | 'medium' | 'thumbnail' | 'hls';

export interface SaveFileOptions {
  folder: StorageFolder;

  userId: string;

  variant: StorageVariant;

  extension: string;

  buffer: Buffer;
}

export interface SaveFileResult {
  fileName: string;

  relativePath: string;

  absolutePath: string;
}

export abstract class StorageService {
  /**
   * Save file into local storage.
   */
  abstract saveFile(options: SaveFileOptions): Promise<SaveFileResult>;

  /**
   * Delete file.
   */
  abstract deleteFile(relativePath: string): Promise<void>;

  /**
   * Check file exists.
   */
  abstract exists(relativePath: string): Promise<boolean>;

  /**
   * Create readable stream.
   */
  abstract createReadStream(relativePath: string): Readable;

  /**
   * Absolute filesystem path.
   */
  abstract getAbsolutePath(relativePath: string): string;

  /**
   * Public URL used by API Gateway.
   */
  abstract getPublicUrl(relativePath: string): string;
}
