import { HPConfig } from './types.ts';

export class HP {
  private config: HPConfig;

  private constructor(config: HPConfig) {
    this.config = config;
  }

  static async create(config: HPConfig) {
    const hp = new HP(config);

    return hp;
  }

  async destroy() {
  }
}
