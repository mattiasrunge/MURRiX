import { assert } from 'std/_util/asserts.ts';
import { Session } from '~/lib/session/mod.ts';
import { Access, ADMIN_ACCESS, NamedNodeData } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';
import { UserAttrs } from './types.ts';
import { getGroups } from './get-groups.ts';

type I = {
  access: Access;
  username: string;
  password: string;
};

type O = Access;

export const login = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, username, password }: I) => {
    assert(access.sid, 'session required');

    const user = await node.resolveOne(api, {
      access: ADMIN_ACCESS,
      path: `/users/${username}`,
    }) as NamedNodeData<UserAttrs>;

    assert(!user.attrs.inactive, 'authentication failed');
    assert(user.attrs.passwordId, 'authentication failed');

    const valid = await api.vault.verifyPassword(user.attrs.passwordId!, password);

    assert(valid, 'authentication failed');

    const groups = await getGroups(api, { access: ADMIN_ACCESS, username });
    const gids = groups.map((group) => group.attrs.gid);

    const session = await Session.create(api.sm, access.sid);
    await session.login(user.attrs.uid, gids);
    await node.update(api, {
      access: ADMIN_ACCESS,
      path: `/users/${username}`,
      attrs: { lastLogin: Date.now() },
    });

    return await session.access();
  },
);
