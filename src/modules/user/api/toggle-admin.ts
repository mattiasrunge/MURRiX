import { assert } from '@std/assert';
import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { Access, ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { Session } from '~/src/shared/session/mod.ts';
import { collection, vault } from '../vault/mod.ts';
import { UserAttrs } from '../types.ts';

type I = {
  access: Access;
  password?: string;
};

type O = Access;

export const toggleAdmin = api<I, O>(
  async (service: ServiceIf, { access, password }: I) => {
    assert(access.sid, 'session required');

    const session = await Session.create(service.getSm(), access.sid);
    const currentAccess = await session.access();

    if (currentAccess.admin) {
      await session.revokeAdmin();
    } else {
      assert(password, 'password required');

      const user = await nodeApi.resolveOne(service, {
        access: ADMIN_ACCESS,
        path: `/users/admin`,
      }) as NamedNodeData<UserAttrs>;

      assert(user.attrs.passwordId, 'authentication failed1');

      const col = collection(service);
      const valid = await vault.verifyPassword(col, user.attrs.passwordId!, password);

      assert(valid, 'authentication failed2');

      await session.grantAdmin();
    }

    return await session.access();
  },
);
