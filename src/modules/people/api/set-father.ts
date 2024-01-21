import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { nodeApi, NodePath } from '~/src/modules/node/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';

type I = {
  access: Access;
  childPath: NodePath;
  fatherPath: NodePath;
};

type O = boolean;

export const setFather = api<I, O>(
  async (service: ServiceIf, { access, childPath, fatherPath }: I) => {
    try {
      // This is a softlink which is grouped so
      // only one needs to be removed.
      await nodeApi.remove(service, {
        access,
        path: `${childPath}/parents/father`,
      });
    } catch {
      // Do nothing
    }

    const group = crypto.randomUUID();

    await nodeApi.softlink(service, {
      access,
      path: `${childPath}/parents/father`,
      targetPath: fatherPath,
      type: 's',
      props: {
        group,
      },
    });

    await nodeApi.softlink(service, {
      access,
      path: `${fatherPath}/children`,
      targetPath: childPath,
      type: 's',
      props: {
        group,
      },
    });

    return true;
  },
);
