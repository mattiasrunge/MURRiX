import { ServiceConfig } from '~/src/shared/service/mod.ts';
import { DBConfig } from '~/src/external/db/mod.ts';
import { MQConfig } from '~/src/external/mq/mod.ts';

export type ModuleNodeConfig = ServiceConfig & {
  db: DBConfig;
  mq: MQConfig;
};
