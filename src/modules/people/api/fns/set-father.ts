import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { apiNode } from '~/src/modules/node/mod.ts';
import { ApiIf } from '../if.ts';

export const setFather: ApiIf['setFather'] = async (ctx: ApiContext<ServiceIf>, { childPath, fatherPath }) => {
  try {
    // This is a softlink which is grouped so
    // only one needs to be removed.
    await apiNode.remove(ctx, {
      path: `${childPath}/parents/father`,
    });
  } catch {
    // Do nothing
  }

  const group = crypto.randomUUID();

  await apiNode.softlink(ctx, {
    path: `${childPath}/parents/father`,
    targetPath: fatherPath,
    type: 's',
    props: {
      group,
    },
  });

  await apiNode.softlink(ctx, {
    path: `${fatherPath}/children`,
    targetPath: childPath,
    type: 's',
    props: {
      group,
    },
  });

  return true;
};
