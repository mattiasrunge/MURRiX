import { Disposable, Disposables } from '~/src/shared/disposables/mod.ts';
import { Log } from './log/mod.ts';
import { Glue } from './glue/mod.ts';
import { WrappedFunction } from './api/mod.ts';
import { ServiceConfig, ServiceIf } from './types.ts';

export class Service implements ServiceIf {
  public readonly name: string;
  public readonly log: Log;
  public readonly instanceId: string;
  public readonly config: ServiceConfig;
  private disposables: Disposables;
  private glue: Glue;

  private constructor(name: string, config: ServiceConfig, glue: Glue) {
    this.name = name;
    this.config = config;
    this.instanceId = config.instanceId;
    this.glue = glue;
    this.log = new Log(name);
    this.disposables = new Disposables();

    this.addDisposable(glue.destroy.bind(glue));

    Deno.addSignalListener('SIGINT', async () => {
      this.log.info('=> SIGINT received, shutting down...');
      await this.destroy();
    });
  }

  static async create(name: string, config: ServiceConfig) {
    const glue = await Glue.create(config);

    return new Service(name, config, glue);
  }

  public addDisposable(disposeFn: Disposable, ref?: any) {
    this.disposables.addDisposable(disposeFn, ref);
  }

  async destroy() {
    try {
      await this.disposables.destroy();
    } catch (error) {
      this.log.error('Failed to cleanup service', error);
    }
  }

  // Service API

  async registerApiFunctions(fns: WrappedFunction[]) {
    for (const fn of fns) {
      const disposeFn = await fn.load(this);
      this.log.info(`Registered API function ${fn.fnName}`);
      this.addDisposable(disposeFn);
    }
  }

  async eventEmit() {}
  async eventSubscribe() {}
  async eventUnsubscribe() {}

  async cacheSet() {}
  async cacheGet() {}
  async cacheRemove() {}

  async routeAdd() {}
  async routeRemove() {}

  async getFS() {}
  async exposeFS() {}
  async importFS() {}

  getDb() {
    return this.glue.db();
  }

  getMq() {
    return this.glue.mq();
  }

  getSm() {
    return this.glue.sm();
  }
}
