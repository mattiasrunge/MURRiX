import { ServiceConfig } from '~/src/shared/service/mod.ts';
import { DBConfig } from '~/src/external/db/mod.ts';
import { MQConfig } from '~/src/external/mq/mod.ts';
import { SMConfig } from '~/src/external/sm/mod.ts';
import { GroupId, UserId } from '~/src/shared/mode/mod.ts';
import { NodeAttrs } from '~/src/modules/node/mod.ts';
import { PasswordId } from './vault/mod.ts';

export type ModuleUserConfig = ServiceConfig & {
  db: DBConfig;
  mq: MQConfig;
  sm: SMConfig;
};

export type GroupAttrs = NodeAttrs & {
  gid: GroupId;
  title?: string | null;
  description?: string | null;
};

export type UserAttrs = NodeAttrs & {
  uid: UserId;
  title?: string | null;
  description?: string | null;
  passwordId?: PasswordId | null;
  inactive?: boolean;
  lastLogin?: number;
};
