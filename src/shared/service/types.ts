import { SM, SMConfig } from '~/src/external/sm/mod.ts';
import { MQ, MQConfig } from '~/src/external/mq/mod.ts';
import { HPConfig } from '~/src/external/hp/mod.ts';
import { DB, DBConfig } from '~/src/external/db/mod.ts';
import { FSConfig } from '~/src/external/fs/mod.ts';
import { Log } from './log/mod.ts';

export type GlueConfig = {
  sm?: SMConfig;
  mq?: MQConfig;
  hp?: HPConfig;
  db?: DBConfig;
  fs?: FSConfig;
};

export type ServiceConfig = GlueConfig & {
  instanceId: string;
};

export interface ServiceIf {
  readonly name: string;
  readonly log: Log;
  readonly instanceId: string;

  getDb(): DB;
  getMq(): MQ;
  getSm(): SM;
}
