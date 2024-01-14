import { Access, NamedNodeData } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';
import { GroupAttrs } from './types.ts';

type I = {
  access: Access;
  username: string;
};

type O = NamedNodeData<GroupAttrs>[];

export const getGroups = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, username }: I) => {
    return await node.resolve(api, {
      access,
      path: `/users/${username}/groups/*`,
    }) as O;
  },
);
