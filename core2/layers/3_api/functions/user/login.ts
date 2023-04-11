import { assert } from 'std/_util/asserts.ts';
import { Access, ADMIN_ACCESS } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import { Session } from '../../session/mod.ts';
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

    const user = await api.nodefs.resolveOne<UserAttrs>(ADMIN_ACCESS, `/users/${username}`);

    assert(!user.attrs.inactive, 'authentication failed');
    assert(user.attrs.passwordId, 'authentication failed');

    const valid = await api.nodefs.verifyPassword(user.attrs.passwordId!, password);

    assert(valid, 'authentication failed');

    const groups = await getGroups(api, { access: ADMIN_ACCESS, username });
    const gids = groups.map((group) => group.attrs.gid);

    const session = await Session.create(api.nodefs.phy, access.sid);
    await session.login(user.attrs.uid, gids);
    await api.nodefs.setAttrs(ADMIN_ACCESS, user._id, { lastLogin: Date.now() });

    return await session.access();
  },
);
