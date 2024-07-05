import { assert } from '@std/assert';
import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { collection, vault } from '../vault/mod.ts';
import { UserAttrs } from '../types.ts';
import { ApiIf } from '../api.ts';

export const setPassword: ApiIf['setPassword'] = async (service, { access, name, oldPassword, newPassword }) => {
  const user = await nodeApi.resolveOne(service, {
    access,
    path: `/users/${name}`,
  }) as NamedNodeData<UserAttrs>;

  if (access.uid !== user.attrs.uid && !access.admin) {
    throw new Error('permission denied');
  }

  const col = collection(service);

  if (!access.admin) {
    assert(user.attrs.passwordId, 'user has no password set');
    assert(oldPassword, 'current password must be provided');

    const valid = await vault.verifyPassword(col, user.attrs.passwordId, oldPassword);
    assert(valid, 'authentication failed');
  }

  const passwordId = await vault.setPassword(col, newPassword);
  await vault.unsetPassword(col, user.attrs.passwordId as string);
  await nodeApi.update(service, {
    access: { ...access, admin: true },
    path: `/users/${name}`,
    attrs: { passwordId },
  });

  return true;
};
