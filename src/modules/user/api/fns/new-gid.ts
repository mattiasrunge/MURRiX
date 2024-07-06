import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { apiNode, NamedNodeData } from '~/src/modules/node/mod.ts';
import { GroupAttrs } from '../../types.ts';
import { ApiIf } from '../if.ts';

export const newGid: ApiIf['newGid'] = async (ctx: ApiContext<ServiceIf>) => {
  const groups = await apiNode.resolve(ctx, {
    path: '/groups/*',
  }) as NamedNodeData<GroupAttrs>[];
  const gids = groups.map((group) => group.attrs.gid);

  return Math.max(0, ...gids) + 1;
};
