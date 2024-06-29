import { assert } from '@std/assert';
import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { Session } from '~/src/shared/session/mod.ts';

type I = {
  access: Access;
};

type O = Access;

export const logout = api<I, O>(
  async (service: ServiceIf, { access }: I) => {
    assert(access.sid, 'session required');

    const session = await Session.create(service.getSm(), access.sid);

    await session.logout();

    return await session.access();
  },
);
