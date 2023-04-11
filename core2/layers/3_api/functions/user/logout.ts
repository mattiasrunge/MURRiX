import { assert } from 'std/_util/asserts.ts';
import { Access } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import { Session } from '../../session/mod.ts';

type I = {
  access: Access;
};

type O = Access;

export const logout = wrap<I, O>(
  import.meta.url,
  async (api: API, { access }: I) => {
    assert(access.sid, 'session required');

    const session = await Session.create(api.nodefs.phy, access.sid);

    await session.logout();

    return await session.access();
  },
);
