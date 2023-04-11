import { assert } from 'std/_util/asserts.ts';
import { basename } from 'std/path/mod.ts';
import { Access, ADMIN_ACCESS, NamedNodeData } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
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

    const paths = await api.nodefs.resolvePaths(access, user._id);

    return {
      ...user,
      name: basename(paths[0]),
      paths,
    };
  },
);
