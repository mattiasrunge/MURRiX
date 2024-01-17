import { DBConfig } from '~/external/db/mod.ts';
import { MQConfig } from '~/external/mq/mod.ts';

export type AppVaultConfig = {
  db: DBConfig;
  mq: MQConfig;
};
