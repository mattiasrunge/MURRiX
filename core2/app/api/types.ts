import { SMConfig } from '~/external/sm/mod.ts';
import { MQConfig } from '~/external/mq/mod.ts';

export type AppVaultConfig = {
  sm: SMConfig;
  mq: MQConfig;
};
