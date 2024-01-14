import { Access, NodePath } from '~/blocks/nodefs/mod.ts';
import { API, wrap } from '~/blocks/api/mod.ts';
import { node } from '~/functions/node.ts';

type I = {
  access: Access;
  childPath: NodePath;
  fatherPath: NodePath;
};

type O = boolean;

export const setFather = wrap<I, O>(
  import.meta.url,
  async (api: API, { access, childPath, fatherPath }: I) => {
    try {
      // This is a softlink which is grouped so
      // only one needs to be removed.
      await node.remove(api, {
        access,
        path: `${childPath}/parents/father`,
      });
    } catch {
      // Do nothing
    }

    const group = crypto.randomUUID();

    await node.softlink(api, {
      access,
      path: `${childPath}/parents/father`,
      targetPath: fatherPath,
      type: 's',
      props: {
        group,
      },
    });

    await node.softlink(api, {
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
