import { GroupId, UserId } from '~/lib/mode/mod.ts';

export type Access = {
  sid?: string;
  admin?: boolean;
  uid: UserId;
  gids: GroupId[];
};

export type AccessLevel = 'r' | 'w' | 'x';
