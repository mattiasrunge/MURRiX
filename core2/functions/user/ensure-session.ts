import { Session } from '~/lib/session/mod.ts';
import { Access } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';

type I = {
  access: Access;
};

type O = Access;

export const ensureSession = wrap<I, O>(
  import.meta.url,
  async (api: API, { access }: I) => {
    const session = await Session.create(api.sm, access.sid);

    return await session.access();
  },
);
