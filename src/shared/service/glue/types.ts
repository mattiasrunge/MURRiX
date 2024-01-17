import { MQConfig } from '~/src/external/mq/mod.ts';
import { SMConfig } from '~/src/external/sm/mod.ts';
import { HPConfig } from '~/src/external/hp/mod.ts';
import { DBConfig } from '~/src/external/db/mod.ts';
import { FSConfig } from '~/src/external/fs/mod.ts';

export type GlueConfig = {
  sm?: SMConfig;
  mq?: MQConfig;
  hp?: HPConfig;
  db?: DBConfig;
  fs?: FSConfig;
};
