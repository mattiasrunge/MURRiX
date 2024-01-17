import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { whoami } from './whoami.ts';

type I = {
  access: Access;
};

type O = NamedNodeData[];

export const getStars = api<I, O>(
  async (service: ServiceIf, { access }: I) => {
    const user = await whoami(service, { access });

    return await nodeApi.resolve(service, {
      access,
      path: `/users/${user.name}/stars/*`,
    });
  },
);
