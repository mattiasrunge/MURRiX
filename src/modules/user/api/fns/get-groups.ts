import { ApiContext } from '~/src/shared/api/types.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';
import { apiNode, NamedNodeData } from '~/src/modules/node/mod.ts';
import { GroupAttrs } from '../../types.ts';
import { ApiIf } from '../if.ts';

export const getGroups: ApiIf['getGroups'] = async (ctx: ApiContext<ServiceIf>, { username }) => {
  return await apiNode.resolve(ctx, {
    path: `/users/${username}/groups/*`,
  }) as NamedNodeData<GroupAttrs>[];
};
