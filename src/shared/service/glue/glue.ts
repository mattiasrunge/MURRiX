import { MQ } from '~/src/external/mq/mod.ts';
import { SM } from '~/src/external/sm/mod.ts';
import { HP } from '~/src/external/hp/mod.ts';
import { DB } from '~/src/external/db/mod.ts';
import { FS } from '~/src/external/fs/mod.ts';
import { log } from '~/src/shared/log/mod.ts';
import { GlueConfig } from './types.ts';

type External = {
  mq?: MQ;
  sm?: SM;
  hp?: HP;
  db?: DB;
  fs?: FS;
};

export class Glue {
  private external: External;

  constructor(external: External) {
    this.external = external;
  }

  static async create(config: GlueConfig) {
    const external: External = {};

    config.mq && log.info('Initializing MQ...');
    config.mq && (external.mq = await MQ.create(config.mq));

    config.sm && log.info('Initializing SM...');
    config.sm && (external.sm = await SM.create(config.sm));

    config.hp && log.info('Initializing HP...');
    config.hp && (external.hp = await HP.create(config.hp));

    config.db && log.info('Initializing DB...');
    config.db && (external.db = await DB.create(config.db));

    config.fs && log.info('Initializing FS...');
    config.fs && (external.fs = await FS.create(config.fs));

    log.info('Glue initialized');

    return new Glue(external);
  }

  async destroy() {
    this.external.mq && (await this.external.mq.destroy());
    this.external.sm && (await this.external.sm.destroy());
    this.external.hp && (await this.external.hp.destroy());
    this.external.db && (await this.external.db.destroy());
    this.external.fs && (await this.external.fs.destroy());
  }

  mq() {
    if (!this.external.mq) {
      throw new Error('MQ not initialized');
    }

    return this.external.mq;
  }

  sm() {
    if (!this.external.sm) {
      throw new Error('SM not initialized');
    }

    return this.external.sm;
  }

  hp() {
    if (!this.external.hp) {
      throw new Error('HP not initialized');
    }

    return this.external.hp;
  }

  db() {
    if (!this.external.db) {
      throw new Error('DB not initialized');
    }

    return this.external.db;
  }

  fs() {
    if (!this.external.fs) {
      throw new Error('FS not initialized');
    }

    return this.external.fs;
  }
}
