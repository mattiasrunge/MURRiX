import { assert } from 'std/_util/asserts.ts';
import { join } from 'std/path/mod.ts';
import { Service } from '~/lib/service/mod.ts';
import { FSAreas, FSConfig, FSInfo, FSPath } from './types.ts';
import FileStream from './file-stream.ts';

export class FS {
  private service: Service;
  private areas: FSAreas = {};

  private constructor(service: Service, config: FSConfig) {
    this.service = service;
    this.areas = config.areas;
  }

  static async connect(service: Service, config: FSConfig) {
    return new FS(service, config);
  }

  async close() {}

  private resolve(areapath: FSPath): string {
    const root = this.areas[areapath.area];
    assert(root, `No area named ${areapath.area} found`);

    return join(root, areapath.name);
  }

  /**
   * @description This function writes a file and returns the file
   * information including checksum.
   */
  async write(areapath: FSPath, stream: ReadableStream<Uint8Array>): Promise<FSInfo> {
    const filepath = this.resolve(areapath);

    const fstream = new FileStream();

    try {
      await Deno.writeFile(filepath, stream.pipeThrough(fstream.getStream()), {
        createNew: true,
      });

      const checksum = fstream.getChecksum();
      await Deno.writeTextFile(`${filepath}.checksum`, checksum);

      return {
        ...areapath,
        size: fstream.getSize(),
        checksum,
      };
    } finally {
      fstream.destroy();
    }
  }

  /**
   * @description This function opens a file and returns a file
   * object to read the file content.
   */
  async read(areapath: FSPath): Promise<Deno.FsFile> {
    const filepath = this.resolve(areapath);

    return await Deno.open(filepath, { read: true });
  }

  /**
   * @description This function removes a file.
   */
  async remove(areapath: FSPath) {
    const filepath = this.resolve(areapath);

    try {
      await Deno.remove(`${filepath}.checksum`);
    } catch {
      // Ignore this error
    }

    await Deno.remove(filepath);
  }

  /**
   * @description This function returns cached information about the file.
   */
  async info(areapath: FSPath): Promise<FSInfo> {
    const filepath = this.resolve(areapath);
    const stat = await Deno.stat(filepath);

    assert(stat.isFile, 'path is not a file');

    let checksum;
    try {
      checksum = await Deno.readTextFile(`${filepath}.checksum`);
    } catch {
      checksum = undefined;
    }

    return {
      ...areapath,
      size: stat.size,
      checksum,
    };
  }

  /**
   * @description This function re-calculates the checksum and size
   * based on the file content and returns the information about the file.
   */
  private async readInfo(areapath: FSPath): Promise<FSInfo> {
    const file = await this.read(areapath);
    const fstream = new FileStream();

    try {
      for await (const _ of file.readable.pipeThrough(fstream.getStream())) {
        // Just consume the stream so fstream can process it
      }

      return {
        ...areapath,
        size: fstream.getSize(),
        checksum: fstream.getChecksum(),
      };
    } finally {
      fstream.destroy();
    }
  }

  /**
   * @description This function re-calculates the checksum and size
   * based on the file content, updates the stored cache and returns
   * the information about the file.
   */
  async regenerateInfo(areapath: FSPath): Promise<FSInfo> {
    const filepath = this.resolve(areapath);
    const info = await this.readInfo(areapath);

    await Deno.writeTextFile(`${filepath}.checksum`, info.checksum as string);

    return info;
  }

  /**
   * @description This function re-calculates the checksum based on
   * the file content and compares to the cached checksum, returns
   * true if the match.
   */
  async verify(areapath: FSPath): Promise<boolean> {
    const cachedInfo = await this.info(areapath);
    const readInfo = await this.readInfo(areapath);

    return cachedInfo.checksum === readInfo.checksum;
  }
}
