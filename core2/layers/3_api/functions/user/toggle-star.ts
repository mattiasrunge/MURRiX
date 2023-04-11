import { assert } from 'std/_util/asserts.ts';
import { Access, GUEST_UID, NodePath } from '~/layers/2_nodefs/mod.ts';
import { API } from '../../api/mod.ts';
import { wrap } from '../../wrap.ts';
import * as node from '../node/mod.ts';
import { whoami } from './whoami.ts';

type I = {
  access: Access;
  path: NodePath;
};

type O = boolean;

export const toggleStar = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, path }: I) => {
    assert(access.uid !== GUEST_UID, 'permission denied');

    const user = await whoami(api, { access });

    const links = await api.nodefs.resolve(access, `/users/${user.name}/stars/*`, { readlink: true });

    const link = links.find((node) => node.props.link === path);

    if (link) {
      await node.remove(api, { access, path: link.paths![0] });
    } else {
      await node.softlink(api, {
        access,
        path: `/users/${user.name}/stars`,
        targetPath: path,
        type: 's',
      });
    }

    return true;
  },
);
