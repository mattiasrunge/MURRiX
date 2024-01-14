import { FSConfig } from '~/external/fs/mod.ts';
import { MQConfig } from '~/external/mq/mod.ts';

export type AppFileConfig = {
  fs: FSConfig;
  mq: MQConfig;
};
