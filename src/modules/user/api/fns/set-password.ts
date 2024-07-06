import { assert } from '@std/assert';
import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { apiNode, NamedNodeData } from '~/src/modules/node/mod.ts';
import { collection, vault } from '../../vault/mod.ts';
import { UserAttrs } from '../../types.ts';
import { ApiIf } from '../if.ts';

export const setPassword: ApiIf['setPassword'] = async (ctx: ApiContext<ServiceIf>, { name, oldPassword, newPassword }) => {
  const user = await apiNode.resolveOne(ctx, {
    path: `/users/${name}`,
  }) as NamedNodeData<UserAttrs>;

  if (ctx.access.uid !== user.attrs.uid && !ctx.access.admin) {
    throw new Error('permission denied');
  }

  const col = collection(ctx.service);

  if (!ctx.access.admin) {
    assert(user.attrs.passwordId, 'user has no password set');
    assert(oldPassword, 'current password must be provided');

    const valid = await vault.verifyPassword(col, user.attrs.passwordId, oldPassword);
    assert(valid, 'authentication failed');
  }

  const passwordId = await vault.setPassword(col, newPassword);
  await vault.unsetPassword(col, user.attrs.passwordId as string);
  await apiNode.update({ ...ctx, access: { ...ctx.access, admin: true } }, {
    path: `/users/${name}`,
    attrs: { passwordId },
  });

  return true;
};
