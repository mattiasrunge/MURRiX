import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { apiNode } from '~/src/modules/node/mod.ts';
import { ApiIf } from '../if.ts';

export const setPartner: ApiIf['setPartner'] = async (ctx: ApiContext<ServiceIf>, { personPath, partnerPath }) => {
  try {
    // This is a softlink which is grouped so
    // only one needs to be removed.
    await apiNode.remove(ctx, {
      path: `${personPath}/partner`,
    });
  } catch {
    // Do nothing
  }

  const group = crypto.randomUUID();

  await apiNode.softlink(ctx, {
    path: `${personPath}/partner`,
    targetPath: partnerPath,
    type: 's',
    props: {
      group,
    },
  });

  await apiNode.softlink(ctx, {
    path: `${partnerPath}/partner`,
    targetPath: personPath,
    type: 's',
    props: {
      group,
    },
  });

  return true;
};
