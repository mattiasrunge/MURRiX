import { Access, NamedNodeData, UserId } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';
import { UserAttrs } from './types.ts';

type I = {
  access: Access;
};

type O = UserId;

export const newUid = wrap<I, O>(
  import.meta.url,
  async (api: API, { access }: I) => {
    const users = await node.resolve(api, {
      access,
      path: '/users/*',
    }) as NamedNodeData<UserAttrs>[];
    const uids = users.map((user) => user.attrs.uid);

    return Math.max(0, ...uids) + 1;
  },
);
