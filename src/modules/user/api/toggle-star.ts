import { assert } from '@std/assert';
import { nodeApi } from '~/src/modules/node/mod.ts';
import { GUEST_UID } from '~/src/shared/access/mod.ts';
import { whoami } from './whoami.ts';
import { ApiIf } from '../api.ts';

export const toggleStar: ApiIf['toggleStar'] = async (service, { access, path }) => {
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
};
