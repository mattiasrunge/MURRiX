import { assert } from 'std/_util/asserts.ts';
import { basename } from 'std/path/mod.ts';
import { Access, ADMIN_ACCESS, NamedNodeData } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';
import { UserAttrs } from './types.ts';

type I = {
  access: Access;
};

type O = NamedNodeData<UserAttrs>;

export const whoami = wrap<I, O>(
  import.meta.url,
  async (api: API, { access }: I) => {
    const user = await api.nodefs.findOne<UserAttrs>(ADMIN_ACCESS, { 'attrs.uid': access.uid });

    assert(user, 'invalid uid');

    const paths = await node.getPaths(api, {
      access,
      id: user._id,
    });

    return {
      ...user,
      name: basename(paths[0]),
      paths,
    };
  },
);
