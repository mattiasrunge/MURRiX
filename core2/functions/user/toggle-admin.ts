import { assert } from 'std/_util/asserts.ts';
import { Session } from '~/lib/session/mod.ts';
import { Access, ADMIN_ACCESS, NamedNodeData } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';
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

    const session = await Session.create(api.sm, access.sid);
    const currentAccess = await session.access();

    if (currentAccess.admin) {
      await session.revokeAdmin();
    } else {
      assert(password, 'password required');

      const user = await node.resolveOne(api, {
        access: ADMIN_ACCESS,
        path: `/users/admin`,
      }) as NamedNodeData<UserAttrs>;

      assert(user.attrs.passwordId, 'authentication failed1');

      const valid = await api.vault.verifyPassword(user.attrs.passwordId!, password);

      assert(valid, 'authentication failed2');

      await session.grantAdmin();
    }

    return await session.access();
  },
);
