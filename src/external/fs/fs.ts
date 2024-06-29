import { join } from '@std/path';
import { assert } from '@std/assert';
import { log } from '~/src/shared/log/mod.ts';
import { run } from '~/src/shared/run/mod.ts';
import { FSAreaOptions, FSConfig } from './types.ts';
import { FSArea } from './area.ts';

export class FS {
  private config: FSConfig;
  private areas: Record<string, FSArea>;

  private constructor(config: FSConfig) {
    this.config = config;
    this.areas = {};
  }

  static async create(config: FSConfig) {
    log.info(`Found version ${(await run('exiftool', ['-ver'])).match(/(.*?)\n/)![1]} of exiftool`);
    log.info(`Found version ${(await run('file', ['-v'])).match(/file-(.*?)\n/)![1]} of file`);

    return new FS(config);
  }

  async ensureArea(name: string, opts: FSAreaOptions) {
    const path = join(this.config.path, name);
    this.areas[name] = await FSArea.create(name, path, {
      maxIdIterations: this.config.maxIdIterations,
      uploadExpireMs: this.config.uploadExpireMs,
      uploadCleanupMs: this.config.uploadCleanupMs,
      ...opts,
    });

    return this.areas[name];
  }

  getArea(name: string) {
    assert(this.areas[name], `No area named ${name}`);

    return this.areas[name];
  }

  async destroy() {
    for (const area of Object.values(this.areas)) {
      await area.destroy();
    }
  }
}
