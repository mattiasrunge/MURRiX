import { assert } from 'std/assert/mod.ts';
import { basename, dirname, join } from 'std/path/mod.ts';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Server, Upload } from '@tus/server';
import { FileStore } from '@tus/file-store';
import { log } from '~/src/shared/log/mod.ts';
import { FSVerifyResult } from '~/src/external/fs/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { getContextFromIncomingMessage, HttpContext } from '~/src/shared/http-server/mod.ts';
import { FSAreaOptions, FSFileInfo, FSOnCommit, FSUploadMeta } from './types.ts';
import { getFileMetadata, getMimetype, getRawMetadata, getSha256 } from './utils/mod.ts';

const DEFAULT_MAX_ID_ITERATIONS = 10000;
const DEFAULT_UPLOAD_EXPIRE_MS = 1000 * 60 * 60 * 24; // 24 hours
const DEFAULT_UPLOAD_CLEANUP_MS = 1000 * 60 * 60 * 12; // 12 hours
type Section = 'upload' | 'storage' | 'removed';

export class FSArea {
  public readonly name: string;
  public readonly uploadPath?: string;
  public readonly storagePath: string;
  public readonly removedPath?: string;
  private readonly path: string;
  private opts?: FSAreaOptions;
  private uploadServer?: Server;
  private uploadCleanupId = 0;
  private onCommit?: FSOnCommit;

  private constructor(name: string, path: string, opts: FSAreaOptions) {
    this.name = name;
    this.path = path;
    this.uploadPath = opts.hasUpload ? join(path, 'upload') : undefined;
    this.storagePath = join(path, 'storage');
    this.removedPath = opts.hasRemoved ? join(path, 'removed') : undefined;
    this.opts = opts;

    if (this.uploadPath) {
      this.uploadServer = new Server({
        path: '/',
        disableTerminationForFinishedUploads: true,
        respectForwardedHeaders: true,
        datastore: new FileStore({
          directory: this.uploadPath,
          expirationPeriodInMilliseconds: opts?.uploadExpireMs || DEFAULT_UPLOAD_EXPIRE_MS,
        }),
        generateUrl: (req, options) => {
          return `${options.proto}://${options.host}${req.url}/${options.id}`;
        },
        onUploadCreate: async (_, res, upload) => {
          if (!upload?.metadata?.parentPath) {
            throw { body: 'Missing parentPath', status_code: 400 };
          }

          if (!upload?.metadata?.filename) {
            throw { body: 'Missing filename', status_code: 400 };
          }

          return res;
        },
        onUploadFinish: this.uploadFinished.bind(this),
        namingFunction: () => this.generateUniqueFilename(),
      });

      this.uploadCleanupId = setInterval(this.cleanupUpload.bind(this), opts?.uploadCleanupMs || DEFAULT_UPLOAD_CLEANUP_MS);
    }

    this.handleUpload = this.handleUpload.bind(this);
    this.handleGet = this.handleGet.bind(this);
  }

  private async uploadFinished(req: IncomingMessage, res: ServerResponse, upload: Upload) {
    const context = getContextFromIncomingMessage(req);
    const access = context.state.access as Access;
    const info = await this.commit(access, upload.id);

    for (const [name, value] of Object.entries(info.meta)) {
      res.setHeader(name, value);
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

  static async create(name: string, path: string, opts: FSAreaOptions) {
    const area = new FSArea(name, path, opts);

    area.uploadPath && await Deno.mkdir(area.uploadPath, { recursive: true });
    area.storagePath && await Deno.mkdir(area.storagePath, { recursive: true });
    area.removedPath && await Deno.mkdir(area.removedPath, { recursive: true });

    return area;
  }

  async handleUpload(req: IncomingMessage, res: ServerResponse) {
    await this.uploadServer?.handle(req, res);
  }

  async handleGet(context: HttpContext, filename: string) {
    const info = await this.getInfo(filename);

    if (context.request.method === 'HEAD') {
      context.response.status = 200;
      context.response.headers.set('Content-Length', `${info.size}`);
    } else {
      const path = await this.getPath(filename);
      await context.send({
        root: dirname(path),
        path: basename(path),
      });
    }

    context.response.headers.set('Accept-Ranges', 'bytes');
    context.response.headers.set('Last-Modified', new Date(info.createdAt).toUTCString());
    context.response.headers.set('Content-Type', info.mimetype);
    context.response.headers.set('Content-Disposition', `filename=${encodeURIComponent(info.filename)}`);
    context.response.headers.set('Checksum', `sha256=${info.sha256}`);
  }

  setOnCommit(handler: FSOnCommit) {
    this.onCommit = handler;
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

  /**
   * @description Commits a file, takes it from upload to storage
   */
  async commit(access: Access, filename: string) {
    try {
      const uploadFilename = join(this.uploadPath!, filename);
      const uploadMetafile = `${uploadFilename}.json`;
      const upload = JSON.parse(await Deno.readTextFile(uploadMetafile)) as Upload;

      const info: FSFileInfo = {
        id: filename,
        filename: upload.metadata!.filename!,
        sha256: await getSha256(uploadFilename),
        size: upload.size || (await Deno.stat(uploadFilename)).size,
        mimetype: await getMimetype(uploadFilename),
        createdAt: upload.creation_date || new Date().toISOString(),
        createdBy: access.uid,
        meta: {},
      };

      if (this.onCommit) {
        info.meta = await this.onCommit(access, {
          ...info,
          area: this.name,
          uploadMeta: upload.metadata as FSUploadMeta,
          fileMeta: await getFileMetadata(info.mimetype, uploadFilename),
        });
      }

      const storageFilename = join(this.storagePath, info.id);
      const storageInfofile = `${storageFilename}.json`;

      await Deno.writeTextFile(storageInfofile, JSON.stringify(info, null, 2));
      await Deno.rename(uploadFilename, storageFilename);
      await Deno.remove(uploadMetafile);

      return info;
    } catch (error) {
      log.error('[FSArea - ${this.name}] Failed to commit upload to storage after upload finished', error);
      throw error;
    }
  }

  async remove(filename: string) {
    if (this.removedPath) {
      return this.move('storage', 'removed', filename);
    }

    const filepath = await this.getPath(filename);

    await Deno.remove(filepath);
    await Deno.remove(`${filepath}.json`);
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
    } else if (await this.exists('removed', filename)) {
      return this.resolvePath('removed', filename);
    }

    throw new Error('No such file exist');
  }

  async getSection(filename: string): Promise<Section> {
    if (await this.exists('storage', filename)) {
      return 'storage';
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
    const info = await this.getInfo(filename);

    return await getFileMetadata(info.mimetype, await this.getPath(filename));
  }

  async getRawMetadata(filename: string) {
    return await getRawMetadata(await this.getPath(filename));
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
