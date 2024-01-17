import { assert } from 'std/assert/mod.ts';
import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { nodeApi, NodePath } from '~/src/modules/node/mod.ts';
import { Access, GUEST_UID } from '~/src/shared/access/mod.ts';
import { whoami } from './whoami.ts';

type I = {
  access: Access;
  path: NodePath;
};

type O = boolean;

export const toggleStar = api<I, O>(
  async (service: ServiceIf, { access, path }: I) => {
    assert(access.uid !== GUEST_UID, 'permission denied');

    const user = await whoami(service, { access });

    const links = await nodeApi.resolve(service, {
      access,
      path: `/users/${user.name}/stars/*`,
      options: { readlink: true },
    });

    const link = links.find((node) => node.props.link === path);

    if (link) {
      await nodeApi.remove(service, { access, path: link.paths![0] });
    } else {
      await nodeApi.softlink(service, {
        access,
        path: `/users/${user.name}/stars`,
        targetPath: path,
        type: 's',
      });
    }

    return true;
  },
);
