import { Access, NodePath } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';

type I = {
  access: Access;
  childPath: NodePath;
  motherPath: NodePath;
};

type O = boolean;

export const setMother = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, childPath, motherPath }: I) => {
    try {
      // This is a softlink which is grouped so
      // only one needs to be removed.
      await node.remove(api, {
        access,
        path: `${childPath}/parents/mother`,
      });
    } catch {
      // Do nothing
    }

    const group = crypto.randomUUID();

    await node.softlink(api, {
      access,
      path: `${childPath}/parents/mother`,
      targetPath: motherPath,
      type: 's',
      props: {
        group,
      },
    });

    await node.softlink(api, {
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
