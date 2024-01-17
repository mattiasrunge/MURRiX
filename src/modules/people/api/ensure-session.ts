import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { Session } from '~/src/shared/session/mod.ts';

type I = {
  access: Access;
};

type O = Access;

export const ensureSession = api<I, O>(
  async (service: ServiceIf, { access }: I) => {
    const session = await Session.create(service.getSm(), access.sid);

    return await session.access();
  },
);
