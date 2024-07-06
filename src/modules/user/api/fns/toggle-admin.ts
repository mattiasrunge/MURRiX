import { assert } from '@std/assert';
import { ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { Session } from '~/src/shared/session/mod.ts';
import { apiNode, NamedNodeData } from '~/src/modules/node/mod.ts';
import { collection, vault } from '../../vault/mod.ts';
import { UserAttrs } from '../../types.ts';
import { ApiIf } from '../if.ts';

export const toggleAdmin: ApiIf['toggleAdmin'] = async (ctx: ApiContext<ServiceIf>, { password }) => {
  assert(ctx.access.sid, 'session required');

  const session = await Session.create(ctx.service, ctx.access.sid);
  const currentAccess = await session.access();

  if (currentAccess.admin) {
    await session.revokeAdmin();
  } else {
    assert(password, 'password required');

    const user = await apiNode.resolveOne({ ...ctx, access: ADMIN_ACCESS }, {
      path: `/users/admin`,
    }) as NamedNodeData<UserAttrs>;

    assert(user.attrs.passwordId, 'authentication failed1');

    const col = collection(ctx.service);
    const valid = await vault.verifyPassword(col, user.attrs.passwordId!, password);

    assert(valid, 'authentication failed2');

    await session.grantAdmin();
  }

  return await session.access();
};
