import { assert } from '@std/assert';
import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { Access, ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { Session } from '~/src/shared/session/mod.ts';
import { collection, vault } from '../vault/mod.ts';
import { UserAttrs } from '../types.ts';
import { getGroups } from './get-groups.ts';

type I = {
  access: Access;
  username: string;
  password: string;
};

type O = Access;

export const login = api<I, O>(
  async (service: ServiceIf, { access, username, password }: I) => {
    assert(access.sid, 'session required');

    const user = await nodeApi.resolveOne(service, {
      access: ADMIN_ACCESS,
      path: `/users/${username}`,
    }) as NamedNodeData<UserAttrs>;

    assert(!user.attrs.inactive, 'authentication failed');
    assert(user.attrs.passwordId, 'authentication failed');

    const col = collection(service);
    const valid = await vault.verifyPassword(col, user.attrs.passwordId!, password);

    assert(valid, 'authentication failed');

    const groups = await getGroups(service, { access: ADMIN_ACCESS, username });
    const gids = groups.map((group) => group.attrs.gid);

    const session = await Session.create(service.getSm(), access.sid);
    await session.login(user.attrs.uid, gids);
    await nodeApi.update(service, {
      access: ADMIN_ACCESS,
      path: `/users/${username}`,
      attrs: { lastLogin: Date.now() },
    });

    return await session.access();
  },
);
