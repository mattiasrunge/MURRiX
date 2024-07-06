import { assert } from '@std/assert';
import { ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { Session } from '~/src/shared/session/mod.ts';
import { apiNode, NamedNodeData } from '~/src/modules/node/mod.ts';
import { collection, vault } from '../../vault/mod.ts';
import { UserAttrs } from '../../types.ts';
import { ApiIf } from '../if.ts';
import { getGroups } from './get-groups.ts';

export const login: ApiIf['login'] = async (ctx: ApiContext<ServiceIf>, { username, password }) => {
  assert(ctx.access.sid, 'session required');

  const user = await apiNode.resolveOne({ ...ctx, access: ADMIN_ACCESS }, {
    path: `/users/${username}`,
  }) as NamedNodeData<UserAttrs>;

  assert(!user.attrs.inactive, 'authentication failed');
  assert(user.attrs.passwordId, 'authentication failed');

  const col = collection(ctx.service);
  const valid = await vault.verifyPassword(col, user.attrs.passwordId!, password);

  assert(valid, 'authentication failed');

  const groups = await getGroups({ ...ctx, access: ADMIN_ACCESS }, { username });
  const gids = groups.map((group) => group.attrs.gid);

  const session = await Session.create(ctx.service.getSm(), ctx.access.sid);
  await session.login(user.attrs.uid, gids);
  await apiNode.update({ ...ctx, access: ADMIN_ACCESS }, {
    path: `/users/${username}`,
    attrs: { lastLogin: Date.now() },
  });

  return await session.access();
};
