import { assert } from '@std/assert';
import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, vault } from '../vault/mod.ts';
import { UserAttrs } from '../types.ts';

type I = {
  access: Access;
  name: string;
  oldPassword?: string;
  newPassword: string;
};

type O = boolean;

export const setPassword = api<I, O>(
  async (service: ServiceIf, { access, name, oldPassword, newPassword }: I) => {
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
  },
);
