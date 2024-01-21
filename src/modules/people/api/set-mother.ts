import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { nodeApi, NodePath } from '~/src/modules/node/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';

type I = {
  access: Access;
  childPath: NodePath;
  motherPath: NodePath;
};

type O = boolean;

export const setMother = api<I, O>(
  async (service: ServiceIf, { access, childPath, motherPath }: I) => {
    try {
      // This is a softlink which is grouped so
      // only one needs to be removed.
      await nodeApi.remove(service, {
        access,
        path: `${childPath}/parents/mother`,
      });
    } catch {
      // Do nothing
    }

    const group = crypto.randomUUID();

    await nodeApi.softlink(service, {
      access,
      path: `${childPath}/parents/mother`,
      targetPath: motherPath,
      type: 's',
      props: {
        group,
      },
    });

    await nodeApi.softlink(service, {
      access,
      path: `${motherPath}/children`,
      targetPath: childPath,
      type: 's',
      props: {
        group,
      },
    });

    return true;
  },
);
