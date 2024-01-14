import { assert } from 'std/_util/asserts.ts';
import { Access, GUEST_UID, NodePath } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';
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

    const links = await node.resolve(api, {
      access,
      path: `/users/${user.name}/stars/*`,
      options: { readlink: true },
    });

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
