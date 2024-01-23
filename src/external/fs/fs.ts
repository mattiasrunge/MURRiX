import { assert } from 'std/assert/mod.ts';
import { log } from '~/src/shared/log/mod.ts';
import { run } from '~/src/shared/run/mod.ts';
import { FSConfig } from './types.ts';
import { FSArea } from './area.ts';

export class FS {
  private config: FSConfig;
  private areas: Record<string, FSArea>;

  private constructor(config: FSConfig, areas: Record<string, FSArea>) {
    this.config = config;
    this.areas = areas;
  }

  static async create(config: FSConfig) {
    const areas: Record<string, FSArea> = {};

    if (config.areas) {
      assert(Array.isArray(config.areas), 'areas is not an array');

      for (const areaConfig of config.areas) {
        areas[areaConfig.name] = await FSArea.create(areaConfig, {
          maxIdIterations: config.maxIdIterations,
          uploadExpireMs: config.uploadExpireMs,
          uploadCleanupMs: config.uploadCleanupMs,
        });
      }
    }

    log.info(`Found version ${(await run('exiftool', ['-ver'])).match(/(.*?)\n/)![1]} of exiftool`);
    log.info(`Found version ${(await run('file', ['-v'])).match(/file-(.*?)\n/)![1]} of file`);

    return new FS(config, areas);
  }

  getArea(name: string) {
    assert(this.areas[name], `No FS area named ${name} defined`);

    return this.areas[name];
  }

  getAreas() {
    return Object.values(this.areas);
  }

  async destroy() {
    for (const area of this.getAreas()) {
      await area.destroy();
    }
  }
}
