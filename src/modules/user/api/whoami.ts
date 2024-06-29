import { assert } from '@std/assert';
import { basename } from '@std/path';
import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi, NodeData } from '~/src/modules/node/mod.ts';
import { Access, ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import { UserAttrs } from '../types.ts';

type I = {
  access: Access;
};

type O = NamedNodeData<UserAttrs>;

export const whoami = api<I, O>(
  async (service: ServiceIf, { access }: I) => {
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
    };
  },
);
