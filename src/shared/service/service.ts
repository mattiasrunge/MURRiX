import { assert } from '@std/assert';
import { Disposable, Disposables } from '~/src/shared/disposables/mod.ts';
import { log } from '~/src/shared/log/mod.ts';
import { HttpMethod, HttpRouteHandler } from '~/src/shared/http-server/mod.ts';
import { Session } from '~/src/shared/session/mod.ts';
import { Glue } from './glue/mod.ts';
import { WrappedFunction } from './api/mod.ts';
import { ServiceConfig, ServiceIf } from './types.ts';
import { Module } from './module.ts';
import { FSAreaOptions } from '~/src/external/fs/mod.ts';

type ModuleList = Record<string, any>;
export class Service implements ServiceIf {
  public readonly name: string;
  public readonly instanceId: string;
  public readonly config: ServiceConfig;
  private disposables: Disposables;
  private glue: Glue;

  private constructor(config: ServiceConfig, glue: Glue) {
    this.name = config.name;
    this.config = config;
    this.instanceId = config.name;
    this.glue = glue;
    this.disposables = new Disposables();

    this.addDisposable(glue.destroy.bind(glue));

    Deno.addSignalListener('SIGINT', async () => {
      log.info('=> SIGINT received, shutting down...');
      await this.destroy();
    });

    Deno.addSignalListener('SIGTERM', async () => {
      log.info('=> SIGTERM received, shutting down...');
      await this.destroy();
    });

    glue.hp().setAccessResolver(this.accessResolver.bind(this));
  }

  static async create(config: ServiceConfig, modules: ModuleList) {
    log.setName(config.name);
    log.info(`Starting ${config.name} service...`);

    const glue = await Glue.create(config);

    const service = new Service(config, glue);
    const loadedModules: Module[] = [];

    for (const name of config.modules) {
      assert(modules[name], `Unknown module name ${name}`);

      const module = new modules[name](service) as Module;
      loadedModules.push(module);
      service.addDisposable(module);
    }

    for (const module of loadedModules) {
      await module.setup();
    }

    for (const module of loadedModules) {
      await module.init();
    }

    return service;
  }

  private async accessResolver(sid?: string) {
    const session = await Session.create(this.glue.sm(), sid);

    return await session.access();
  }

  public addDisposable(disposeFn: Disposable, ref?: any) {
    this.disposables.addDisposable(disposeFn, ref);
  }

  async destroy() {
    try {
      await this.disposables.destroy();
    } catch (error) {
      log.error('Failed to cleanup service', error);
    }
  }

  // Service API

  async registerApiFunctions(fns: WrappedFunction[]) {
    for (const fn of fns) {
      const disposeFn = await fn.load(this);
      log.info(`Registered API function ${fn.fnName}`);
      this.addDisposable(disposeFn);
    }
  }

  async addRoute(methods: HttpMethod[], path: string, handler: HttpRouteHandler) {
    await this.glue.hp().addRoute(methods, path, handler);
  }

  async ensureFSArea(name: string, opts: FSAreaOptions) {
    return this.glue.fs().ensureArea(name, opts);
  }

  getFSArea(name: string) {
    return this.glue.fs().getArea(name);
  }

  async eventEmit() {}
  async eventSubscribe() {}
  async eventUnsubscribe() {}

  async cacheSet() {}
  async cacheGet() {}
  async cacheRemove() {}

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

  getHp() {
    return this.glue.hp();
  }
}
