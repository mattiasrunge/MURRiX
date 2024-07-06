import { SM, SMConfig } from '~/src/external/sm/mod.ts';
import { MQ, MQConfig } from '~/src/external/mq/mod.ts';
import { HP, HPConfig } from '~/src/external/hp/mod.ts';
import { DB, DBConfig } from '~/src/external/db/mod.ts';
import { FS, FSArea, FSAreaOptions, FSConfig } from '~/src/external/fs/mod.ts';
import { HttpMethod, HttpRouteHandler } from '~/src/shared/http-server/mod.ts';
import { Disposable } from '~/src/shared/disposables/mod.ts';
import { ApiConnection, ApiFunction } from '~/src/shared/api/types.ts';

export type GlueConfig = {
  sm?: SMConfig;
  mq?: MQConfig;
  hp?: HPConfig;
  db?: DBConfig;
  fs?: FSConfig;
};

export type ServiceConfig = GlueConfig & {
  name: string;
  dev?: boolean;
  modules: string[];
};

export type ModuleList = Record<string, any>;

export interface ServiceIf extends ApiConnection {
  readonly name: string;
  readonly instanceId: string;

  addDisposable(disposeFn: Disposable, ref?: any): void;

  callHandler(name: string, handler: ApiFunction): Promise<void>;

  addRoute(methods: HttpMethod[], path: string, handler: HttpRouteHandler): Promise<void>;
  ensureFSArea(name: string, opts: FSAreaOptions): Promise<FSArea>;
  getFSArea(name: string): FSArea;
  getDb(): DB;
  getMq(): MQ;
  getSm(): SM;
  getHp(): HP;

  isDev(): boolean;
}
