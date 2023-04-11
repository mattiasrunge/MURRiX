import { assert } from 'std/_util/asserts.ts';
import { Access, ADMIN_ACCESS } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import { Session } from '../../session/mod.ts';
import { UserAttrs } from './types.ts';

type I = {
  access: Access;
  password?: string;
};

type O = Access;

export const toggleAdmin = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, password }: I) => {
    assert(access.sid, 'session required');

    const session = await Session.create(api.nodefs.phy, access.sid);
    const currentAccess = await session.access();

    if (currentAccess.admin) {
      await session.revokeAdmin();
    } else {
      assert(password, 'password required');

      const user = await api.nodefs.resolveOne<UserAttrs>(ADMIN_ACCESS, `/users/admin`);

      assert(user.attrs.passwordId, 'authentication failed');

      const valid = await api.nodefs.verifyPassword(user.attrs.passwordId!, password);

      assert(valid, 'authentication failed');

      await session.grantAdmin();
    }

    return await session.access();
  },
);
