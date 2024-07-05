import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { GroupAttrs } from '../types.ts';
import { ApiIf } from '../api.ts';

export const getGroups: ApiIf['getGroups'] = async (service, { access, username }) => {
  return await nodeApi.resolve(service, {
    access,
    path: `/users/${username}/groups/*`,
  }) as NamedNodeData<GroupAttrs>[];
};
