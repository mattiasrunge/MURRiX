import { EmptyObject } from '~/src/shared/types.ts';
import { Access } from '~/src/shared/access/types.ts';
import { GroupId, UserId } from '~/src/shared/mode/types.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { NamedNodeData, NodePath } from '~/src/modules/node/types.ts';
import { GroupAttrs, UserAttrs } from '../types.ts';
import { PasswordId } from '../vault/types.ts';

export type ApiIf = {
  ensureSession(ctx: ApiContext, args: EmptyObject): Promise<Access>;
  getGroups(ctx: ApiContext, args: { username: string }): Promise<NamedNodeData<GroupAttrs>[]>;
  getStars(ctx: ApiContext, args: EmptyObject): Promise<NamedNodeData[]>;
  join(ctx: ApiContext, args: { group: string; user: string }): Promise<boolean>;
  leave(ctx: ApiContext, args: { group: string; user: string }): Promise<boolean>;
  login(ctx: ApiContext, args: { username: string; password: string }): Promise<Access>;
  logout(ctx: ApiContext, args: EmptyObject): Promise<Access>;
  makeGroup(ctx: ApiContext, args: { name: string; gid?: GroupId; title?: string; description?: string }): Promise<NamedNodeData<GroupAttrs>>;
  makeUser(ctx: ApiContext, args: { name: string; uid?: UserId; title?: string; description?: string; passwordId?: PasswordId }): Promise<NamedNodeData<UserAttrs>>;
  newGid(ctx: ApiContext, args: EmptyObject): Promise<GroupId>;
  newUid(ctx: ApiContext, args: EmptyObject): Promise<UserId>;
  setPassword(ctx: ApiContext, args: { name: string; oldPassword?: string; newPassword: string }): Promise<boolean>;
  toggleAdmin(ctx: ApiContext, args: { password?: string }): Promise<Access>;
  toggleStar(ctx: ApiContext, args: { path: NodePath }): Promise<boolean>;
  whoami(ctx: ApiContext, args: EmptyObject): Promise<NamedNodeData<UserAttrs>>;
};
