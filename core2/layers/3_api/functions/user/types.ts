import { GroupId, NodeAttrs, PasswordId, UserId } from '~/layers/2_nodefs/mod.ts';

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
