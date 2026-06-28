/* eslint-disable @typescript-eslint/require-await */
import { Injectable, OnModuleInit } from '@nestjs/common';

import { promises as fs } from 'fs';
import { createReadStream, existsSync } from 'fs';

import { dirname, join } from 'path';

import { Readable } from 'stream';
import { v4 as uuid } from 'uuid';

import {
  SaveFileOptions,
  SaveFileResult,
  StorageService,
} from './storage.service';

@Injectable()
export class LocalStorageService
  extends StorageService
  implements OnModuleInit
{
  private readonly root =
    process.env.MEDIA_STORAGE_PATH || join(process.cwd(), 'storage');

  private readonly publicUrl =
    process.env.MEDIA_HTTP_BASE_URL || 'http://localhost:4009';

  async onModuleInit(): Promise<void> {
    await this.createDefaultFolders();
  }

  private async createDefaultFolders(): Promise<void> {
    const folders = ['images', 'videos', 'avatars', 'covers', 'temp'];

    await Promise.all(
      folders.map((folder) =>
        fs.mkdir(join(this.root, folder), {
          recursive: true,
        }),
      ),
    );
  }

  async saveFile(options: SaveFileOptions): Promise<SaveFileResult> {
    const generatedName = `${uuid()}.${options.extension}`;

    const relativePath = join(
      options.folder,
      options.userId,
      options.variant,
      generatedName,
    );

    const absolutePath = join(this.root, relativePath);

    await fs.mkdir(dirname(absolutePath), {
      recursive: true,
    });

    await fs.writeFile(absolutePath, options.buffer);

    return {
      fileName: generatedName,
      relativePath: relativePath.replace(/\\/g, '/'),
      absolutePath,
    };
  }

  async deleteFile(relativePath: string): Promise<void> {
    const absolutePath = this.getAbsolutePath(relativePath);

    if (existsSync(absolutePath)) {
      await fs.unlink(absolutePath);
    }
  }

  async exists(relativePath: string): Promise<boolean> {
    return existsSync(this.getAbsolutePath(relativePath));
  }

  createReadStream(relativePath: string): Readable {
    return createReadStream(this.getAbsolutePath(relativePath));
  }

  getAbsolutePath(relativePath: string): string {
    return join(this.root, relativePath);
  }

  getPublicUrl(relativePath: string): string {
    return `${this.publicUrl}/media/${relativePath.replace(/\\/g, '/')}`;
  }
}
