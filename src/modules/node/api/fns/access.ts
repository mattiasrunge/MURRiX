import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const access: ApiIf['access'] = async (ctx: ApiContext<ServiceIf>, { path, level }) => {
  const col = collection(ctx.service);
  return await nodefs.hasAccess(col, ctx.access, path, level);
};
