// TODO: This is a circular dep... improve
import { FSConfig } from '~/layers/1_physical/fs/mod.ts';
import { SMConfig } from '~/layers/1_physical/sm/mod.ts';
import { DBConfig } from '~/layers/1_physical/db/mod.ts';
import { MQConfig } from '~/layers/1_physical/mq/mod.ts';

export type Config = {
  fs: FSConfig;
  sm: SMConfig;
  db: DBConfig;
  mq: MQConfig;
};

export type JSONValue =
  | null
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | JSONValue[];

export type NullPartial<T> = { [P in keyof T]?: T[P] | null };

export type DisposeFn = () => Promise<void>;
