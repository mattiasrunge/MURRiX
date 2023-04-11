import { Config } from './types.ts';
import { log } from './log/mod.ts';

export class Common {
  public log = log;
  public config: Config;

  private constructor(config: Config) {
    this.config = config;
  }

  static async create(config: Config) {
    return new Common(config);
  }

  async destroy() {}
}
