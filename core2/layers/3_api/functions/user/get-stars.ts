import { Access, NamedNodeData } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import { whoami } from './whoami.ts';

type I = {
  access: Access;
};

type O = NamedNodeData[];

export const getStars = wrap<I, O>(
  import.meta.url,
  async (api: API, { access }: I) => {
    const user = await whoami(api, { access });

    return await api.nodefs.resolve(access, `/users/${user.name}/stars/*`);
  },
);
