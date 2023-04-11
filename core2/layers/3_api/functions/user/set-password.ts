import { assert } from 'std/_util/asserts.ts';
import { Access } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
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
    const user = await api.nodefs.resolveOne<UserAttrs>(access, `/users/${name}`);

    if (access.uid !== user.attrs.uid && !access.admin) {
      throw new Error('permission denied');
    }

    if (!access.admin) {
      assert(user.attrs.passwordId, 'user has no password set');
      assert(oldPassword, 'current password must be provided');

      const valid = await api.nodefs.verifyPassword(user.attrs.passwordId, oldPassword);
      assert(valid, 'authentication failed');
    }

    const passwordId = await api.nodefs.setPassword(newPassword);
    await api.nodefs.unsetPassword(user.attrs.passwordId as string);
    await api.nodefs.setAttrs({ ...access, admin: true }, user._id, { passwordId });

    return true;
  },
);
