import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { whoami } from './whoami.ts';
import { ApiIf } from '../api.ts';

export const getStars: ApiIf['getStars'] = async (service, { access }) => {
  const user = await whoami(service, { access });

  return await nodeApi.resolve(service, {
    access,
    path: `/users/${user.name}/stars/*`,
  }) as NamedNodeData[];
};
