import { assert } from '@std/assert';
import { Session } from '~/src/shared/session/mod.ts';
import { ApiIf } from '../api.ts';

export const logout: ApiIf['logout'] = async (service, { access }) => {
  assert(access.sid, 'session required');

  const session = await Session.create(service.getSm(), access.sid);

  await session.logout();

  return await session.access();
};
