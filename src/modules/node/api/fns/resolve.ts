import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const resolve: ApiIf['resolve'] = async (ctx: ApiContext<ServiceIf>, { path, options }) => {
  const col = collection(ctx.service);
  return await nodefs.resolve(col, ctx.access, path, options);
};
