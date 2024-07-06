import { assert } from '@std/assert';
import { GUEST_UID } from '~/src/shared/access/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { apiNode, NamedNodeData } from '~/src/modules/node/mod.ts';
import { ApiIf } from '../if.ts';
import { whoami } from './whoami.ts';

export const toggleStar: ApiIf['toggleStar'] = async (ctx: ApiContext<ServiceIf>, { path }) => {
  assert(ctx.access.uid !== GUEST_UID, 'permission denied');

  const user = await whoami(ctx, {});

  const links = await apiNode.resolve(ctx, {
    path: `/users/${user.name}/stars/*`,
    options: { readlink: true },
  }) as NamedNodeData[];

  const link = links.find((node) => node.props.link === path);

  if (link) {
    await apiNode.remove(ctx, { path: link.paths![0] });
  } else {
    await apiNode.softlink(ctx, {
      path: `/users/${user.name}/stars`,
      targetPath: path,
      type: 's',
    });
  }

  return true;
};
