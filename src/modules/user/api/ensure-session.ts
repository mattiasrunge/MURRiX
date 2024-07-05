import { Session } from '~/src/shared/session/mod.ts';
import { ApiIf } from '../api.ts';

export const ensureSession: ApiIf['ensureSession'] = async (service, { access }) => {
  const session = await Session.create(service.getSm(), access.sid);

  return await session.access();
};
