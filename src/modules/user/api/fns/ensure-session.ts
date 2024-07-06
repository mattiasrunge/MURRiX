import { Session } from '~/src/shared/session/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { ApiIf } from '../if.ts';

export const ensureSession: ApiIf['ensureSession'] = async (ctx: ApiContext<ServiceIf>) => {
  const session = await Session.create(ctx.service.getSm(), ctx.access.sid);

  return await session.access();
};
