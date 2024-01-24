import { SM, SMConfig } from '~/src/external/sm/mod.ts';
import { MQ, MQConfig } from '~/src/external/mq/mod.ts';
import { HP, HPConfig } from '~/src/external/hp/mod.ts';
import { DB, DBConfig } from '~/src/external/db/mod.ts';
import { FS, FSArea, FSAreaOptions, FSConfig } from '~/src/external/fs/mod.ts';
import { WrappedFunction } from './api/mod.ts';
import { HttpMethod, HttpRouteHandler } from '~/src/shared/http-server/mod.ts';

export type GlueConfig = {
  sm?: SMConfig;
  mq?: MQConfig;
  hp?: HPConfig;
  db?: DBConfig;
  fs?: FSConfig;
};

export type ServiceConfig = GlueConfig & {
  name: string;
  modules: string[];
};

export interface ServiceIf {
  readonly name: string;
  readonly instanceId: string;

  registerApiFunctions(fns: WrappedFunction[]): Promise<void>;
  addRoute(methods: HttpMethod[], path: string, handler: HttpRouteHandler): Promise<void>;
  ensureFSArea(name: string, opts: FSAreaOptions): Promise<FSArea>;
  getFSArea(name: string): FSArea;
  getDb(): DB;
  getMq(): MQ;
  getSm(): SM;
  getHp(): HP;
}
