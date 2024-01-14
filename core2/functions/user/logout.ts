import { assert } from 'std/_util/asserts.ts';
import { Access } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { Session } from '~/lib/session/mod.ts';

type I = {
  access: Access;
};

type O = Access;

export const logout = wrap<I, O>(
  import.meta.url,
  async (api: API, { access }: I) => {
    assert(access.sid, 'session required');

    const session = await Session.create(api.sm, access.sid);

    await session.logout();

    return await session.access();
  },
);
