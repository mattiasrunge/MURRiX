import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { apiNode, NamedNodeData } from '~/src/modules/node/mod.ts';
import { ApiIf } from '../if.ts';
import { whoami } from './whoami.ts';

export const getStars: ApiIf['getStars'] = async (ctx: ApiContext<ServiceIf>) => {
  const user = await whoami(ctx, {});

  return await apiNode.resolve(ctx, {
    path: `/users/${user.name}/stars/*`,
  }) as NamedNodeData[];
};
