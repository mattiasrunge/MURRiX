import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { GroupAttrs } from '../types.ts';
import { ApiIf } from '../api.ts';

export const newGid: ApiIf['newGid'] = async (service, { access }) => {
  const groups = await nodeApi.resolve(service, {
    access,
    path: '/groups/*',
  }) as NamedNodeData<GroupAttrs>[];
  const gids = groups.map((group) => group.attrs.gid);

  return Math.max(0, ...gids) + 1;
};
