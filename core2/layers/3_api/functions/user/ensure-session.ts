import { Access } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import { Session } from '../../session/mod.ts';

type I = {
  access: Access;
};

type O = Access;

export const ensureSession = wrap<I, O>(
  import.meta.url,
  async (api: API, { access }: I) => {
    const session = await Session.create(api.nodefs.phy, access.sid);

    return await session.access();
  },
);
