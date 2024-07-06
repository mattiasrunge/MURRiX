import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const resolvePaths: ApiIf['resolvePaths'] = async (ctx: ApiContext<ServiceIf>, { id }) => {
  const col = collection(ctx.service);
  return await nodefs.resolvePaths(col, ctx.access, id);
};
