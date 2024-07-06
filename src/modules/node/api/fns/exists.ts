import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const exists: ApiIf['exists'] = async (ctx: ApiContext<ServiceIf>, { path }) => {
  const col = collection(ctx.service);
  return await nodefs.exists(col, ctx.access, path);
};
