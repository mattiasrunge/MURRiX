import { Access, NamedNodeData } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';
import { whoami } from './whoami.ts';

type I = {
  access: Access;
};

type O = NamedNodeData[];

export const getStars = wrap<I, O>(
  import.meta.url,
  async (api: API, { access }: I) => {
    const user = await whoami(api, { access });

    return await node.resolve(api, {
      access,
      path: `/users/${user.name}/stars/*`,
    });
  },
);
