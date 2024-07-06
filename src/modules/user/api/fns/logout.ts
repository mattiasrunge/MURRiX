import { assert } from '@std/assert';
import { Session } from '~/src/shared/session/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { ApiIf } from '../if.ts';

export const logout: ApiIf['logout'] = async (ctx: ApiContext<ServiceIf>) => {
  assert(ctx.access.sid, 'session required');

  const session = await Session.create(ctx.service.getSm(), ctx.access.sid);

  await session.logout();

  return await session.access();
};
