import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const remove: ApiIf['remove'] = async (ctx: ApiContext<ServiceIf>, { path }) => {
  const col = collection(ctx.service);
  return await nodefs.remove(col, ctx.access, path);
};
