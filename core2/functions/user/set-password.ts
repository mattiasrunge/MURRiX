import { assert } from 'std/_util/asserts.ts';
import { Access, NamedNodeData } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';
import { UserAttrs } from './types.ts';

type I = {
  access: Access;
  name: string;
  oldPassword?: string;
  newPassword: string;
};

type O = boolean;

export const setPassword = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, name, oldPassword, newPassword }: I) => {
    const user = await node.resolveOne(api, {
      access,
      path: `/users/${name}`,
    }) as NamedNodeData<UserAttrs>;

    if (access.uid !== user.attrs.uid && !access.admin) {
      throw new Error('permission denied');
    }

    if (!access.admin) {
      assert(user.attrs.passwordId, 'user has no password set');
      assert(oldPassword, 'current password must be provided');

      const valid = await api.vault.verifyPassword(user.attrs.passwordId, oldPassword);
      assert(valid, 'authentication failed');
    }

    const passwordId = await api.vault.setPassword(newPassword);
    await api.vault.unsetPassword(user.attrs.passwordId as string);
    await node.update(api, {
      access: { ...access, admin: true },
      path: `/users/${name}`,
      attrs: { passwordId },
    });

    return true;
  },
);
