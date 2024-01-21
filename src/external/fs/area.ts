import { IncomingMessage, ServerResponse } from 'node:http';
import { Server, Upload } from '@tus/server';
import { FileStore } from '@tus/file-store';
import { join } from 'std/path/mod.ts';
import { log } from '~/src/shared/log/mod.ts';
import { FSAreaConfig, FSFileInfo } from './types.ts';
import { getMetadata, getMimetype, getSha256 } from './utils/mod.ts';
import { assert } from 'std/assert/mod.ts';
import { FSVerifyResult } from '~/src/external/fs/mod.ts';

const DEFAULT_MAX_ID_ITERATIONS = 10000;
const DEFAULT_UPLOAD_EXPIRE_MS = 1000 * 60 * 60 * 24; // 24 hours
const DEFAULT_UPLOAD_CLEANUP_MS = 1000 * 60 * 60 * 12; // 12 hours
type Section = 'upload' | 'staging' | 'storage' | 'removed';

export type FSAreaOptions = {
  maxIdIterations?: number;
  uploadExpireMs?: number;
  uploadCleanupMs?: number;
};

export class FSArea {
  public readonly name: string;
  public readonly uploadPath?: string;
  public readonly stagingPath: string;
  public readonly storagePath: string;
  public readonly removedPath?: string;
  private opts?: FSAreaOptions;
  private uploadServer?: Server;
  private uploadCleanupId = 0;

  private constructor(config: FSAreaConfig, opts?: FSAreaOptions) {
    this.name = name;
    this.uploadPath = config.hasUpload ? join(config.path, 'upload') : undefined;
    this.stagingPath = join(config.path, 'staging');
    this.storagePath = join(config.path, 'storage');
    this.removedPath = config.hasRemoved ? join(config.path, 'removed') : undefined;
    this.opts = opts;

    if (this.uploadPath) {
      this.uploadServer = new Server({
        path: '/',
        disableTerminationForFinishedUploads: true,
        datastore: new FileStore({
          directory: this.uploadPath,
          expirationPeriodInMilliseconds: opts?.uploadExpireMs || DEFAULT_UPLOAD_EXPIRE_MS,
        }),
        generateUrl: (req, options) => {
          return `${options.proto}://${options.host}${req.url}/${options.id}`;
        },
        onUploadFinish: this.uploadFinished.bind(this),
        namingFunction: () => this.generateUniqueFilename(),
      });

      this.uploadCleanupId = setInterval(this.cleanupUpload.bind(this), opts?.uploadCleanupMs || DEFAULT_UPLOAD_CLEANUP_MS);
    }

    this.handleUpload = this.handleUpload.bind(this);
  }

  private async uploadFinished(_: IncomingMessage, res: ServerResponse, upload: Upload) {
    try {
      const uploadFilename = join(this.uploadPath!, upload.id);
      const uploadMetafile = `${uploadFilename}.json`;

      const info: FSFileInfo = {
        id: upload.id,
        filename: upload?.metadata?.filename || upload.id,
        sha256: await getSha256(uploadFilename),
        size: upload.size || (await Deno.stat(uploadFilename)).size,
        mimetype: await getMimetype(uploadFilename),
        createdAt: upload.creation_date || new Date().toISOString(),
      };

      const stagingFilename = join(this.stagingPath, info.id);
      const stagingInfofile = `${stagingFilename}.json`;

      await Deno.writeTextFile(stagingInfofile, JSON.stringify(info, null, 2));
      await Deno.rename(uploadFilename, stagingFilename);
      await Deno.remove(uploadMetafile);
    } catch (error) {
      log.error('[FSArea - ${this.name}] Failed to move upload to staging when finished', error);
      throw error;
    }

    return res;
  }

  private async cleanupUpload() {
    if (this.uploadServer) {
      try {
        await this.uploadServer.cleanUpExpiredUploads();
      } catch (error) {
        log.error('[FSArea - ${this.name}] Failed to clean expired uploads', error);
      }
    }
  }

  static async create(config: FSAreaConfig, opts?: FSAreaOptions) {
    const area = new FSArea(config, opts);

    area.uploadPath && await Deno.mkdir(area.uploadPath, { recursive: true });
    area.stagingPath && await Deno.mkdir(area.stagingPath, { recursive: true });
    area.storagePath && await Deno.mkdir(area.storagePath, { recursive: true });
    area.removedPath && await Deno.mkdir(area.removedPath, { recursive: true });

    return area;
  }

  async handleUpload(req: IncomingMessage, res: ServerResponse) {
    await this.uploadServer?.handle(req, res);
  }

  hasSection(section: Section) {
    try {
      this.resolvePath(section);
      return true;
    } catch {
      return false;
    }
  }

  hasUpload() {
    return !!this.uploadPath;
  }

  async commit(filename: string) {
    return this.move('staging', 'storage', filename);
  }

  async remove(filename: string) {
    return this.move('storage', 'removed', filename);
  }

  async verify(filename: string) {
    const info = await this.getInfo(filename);
    const filepath = await this.getPath(filename);
    const sha256 = await getSha256(filepath);

    return {
      ok: sha256 === info.sha256,
      type: 'sha256',
      expected: info.sha256,
      actual: sha256,
    } as FSVerifyResult;
  }

  async getPath(filename: string) {
    if (await this.exists('storage', filename)) {
      return this.resolvePath('storage', filename);
    } else if (await this.exists('staging', filename)) {
      return this.resolvePath('staging', filename);
    } else if (await this.exists('removed', filename)) {
      return this.resolvePath('removed', filename);
    }

    throw new Error('No such file exist');
  }

  async getSection(filename: string): Promise<Section> {
    if (await this.exists('storage', filename)) {
      return 'storage';
    } else if (await this.exists('staging', filename)) {
      return 'staging';
    } else if (await this.exists('removed', filename)) {
      return 'removed';
    } else if (await this.exists('upload', filename)) {
      return 'upload';
    }

    throw new Error('No such file exist');
  }

  async getInfo(filename: string) {
    const filepath = await this.getPath(filename);
    const content = await Deno.readTextFile(`${filepath}.json`);

    return JSON.parse(content) as FSFileInfo;
  }

  async getMetadata(filename: string) {
    return await getMetadata(await this.getPath(filename));
  }

  async destroy() {
    if (this.uploadCleanupId > 0) {
      clearInterval(this.uploadCleanupId);
      this.uploadCleanupId = 0;
    }
  }

  private resolvePath(section: Section, filename?: string) {
    if (section === 'upload' && this.uploadPath) {
      return filename ? join(this.uploadPath, filename) : this.uploadPath;
    } else if (section === 'staging' && this.stagingPath) {
      return filename ? join(this.stagingPath, filename) : this.stagingPath;
    } else if (section === 'storage' && this.storagePath) {
      return filename ? join(this.storagePath, filename) : this.storagePath;
    } else if (section === 'removed' && this.removedPath) {
      return filename ? join(this.removedPath, filename) : this.removedPath;
    }

    throw new Error(`Invalid section type: ${section}`);
  }

  private async exists(section: Section, filename: string) {
    try {
      await Deno.stat(this.resolvePath(section, filename));
      return true;
    } catch {
      return false;
    }
  }

  private async generateUniqueFilename() {
    let filename: string;
    let counter = 0;

    while (true) {
      counter++;

      if (counter >= (this?.opts?.maxIdIterations || DEFAULT_MAX_ID_ITERATIONS)) {
        throw new Error(`Could not find a unique filename after ${counter} iterations`);
      }

      filename = crypto.randomUUID().split('-').slice(1, 4).join('-');

      if (this.hasSection('upload') && await this.exists('upload', filename)) {
        continue;
      }

      if (this.hasSection('staging') && await this.exists('staging', filename)) {
        continue;
      }

      if (this.hasSection('storage') && await this.exists('storage', filename)) {
        continue;
      }

      if (this.hasSection('removed') && await this.exists('removed', filename)) {
        continue;
      }

      break;
    }

    return filename;
  }

  private async move(sourceSection: Section, targetSection: Section, filename: string) {
    assert(sourceSection !== targetSection, 'Source and target section can not be the same');
    assert(targetSection !== 'staging', 'Target section can not be staging');
    assert(targetSection !== 'upload', 'Target section can not be upload');
    assert(sourceSection !== 'upload', 'Source section can not be upload');
    assert(!this.removedPath && (sourceSection === 'removed' || targetSection === 'removed'), 'There is no removed path configured');

    try {
      const sourceFilepath = this.resolvePath(sourceSection, filename);
      const sourceInfofile = `${sourceFilepath}.json`;
      const targetFilepath = this.resolvePath(targetSection, filename);
      const targetInfofile = `${targetFilepath}.json`;

      // Ensure the source files exist
      await Deno.stat(sourceFilepath);
      await Deno.stat(sourceInfofile);

      await Deno.rename(sourceFilepath, targetFilepath);

      try {
        await Deno.rename(sourceInfofile, targetInfofile);
      } catch (error) {
        // Move the file back
        await Deno.rename(targetFilepath, sourceFilepath);
        throw error;
      }
    } catch (error) {
      log.error(`[FSArea - ${this.name}] Failed to move ${filename} from ${sourceSection} to ${targetSection}`, error);
      throw error;
    }
  }
}
