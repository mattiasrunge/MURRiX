import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { UserId } from '~/src/shared/mode/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { UserAttrs } from '../types.ts';

type I = {
  access: Access;
};

type O = UserId;

export const newUid = api<I, O>(
  async (service: ServiceIf, { access }: I) => {
    const users = await nodeApi.resolve(service, {
      access,
      path: '/users/*',
    }) as NamedNodeData<UserAttrs>[];
    const uids = users.map((user) => user.attrs.uid);

    return Math.max(0, ...uids) + 1;
  },
);
