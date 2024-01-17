import { FSConfig } from './types.ts';

export class FS {
  private config: FSConfig;

  private constructor(config: FSConfig) {
    this.config = config;
  }

  static async create(config: FSConfig) {
    const fs = new FS(config);

    return fs;
  }

  async destroy() {
  }
}
