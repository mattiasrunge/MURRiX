import { assert } from '@std/assert';
import { basename } from '@std/path';
import { NamedNodeData, nodeApi, NodeData } from '~/src/modules/node/mod.ts';
import { ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { UserAttrs } from '../types.ts';
import { ApiIf } from '../api.ts';

export const whoami: ApiIf['whoami'] = async (service, { access }) => {
  const user = await nodeApi.findOne(service, {
    access: ADMIN_ACCESS,
    query: { 'attrs.uid': access.uid },
  }) as NodeData<UserAttrs>;

  assert(user, 'invalid uid');

  const paths = await nodeApi.resolvePaths(service, {
    access,
    id: user._id,
  });

  return {
    ...user,
    name: basename(paths[0]),
    paths,
  } as NamedNodeData<UserAttrs>;
};
