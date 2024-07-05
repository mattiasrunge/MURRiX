import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { UserAttrs } from '../types.ts';
import { ApiIf } from '../api.ts';

export const newUid: ApiIf['newUid'] = async (service, { access }) => {
  const users = await nodeApi.resolve(service, {
    access,
    path: '/users/*',
  }) as NamedNodeData<UserAttrs>[];
  const uids = users.map((user) => user.attrs.uid);

  return Math.max(0, ...uids) + 1;
};
