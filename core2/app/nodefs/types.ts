import { DBConfig } from '~/external/db/mod.ts';
import { MQConfig } from '~/external/mq/mod.ts';

export type AppNodeFSConfig = {
  db: DBConfig;
  mq: MQConfig;
};
