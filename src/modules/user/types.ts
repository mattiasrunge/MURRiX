import { GroupId, UserId } from '~/src/shared/mode/mod.ts';
import { NodeAttrs } from '~/src/modules/node/mod.ts';
import { PasswordId } from './vault/mod.ts';

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
