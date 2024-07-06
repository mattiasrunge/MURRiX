import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const uniqueName: ApiIf['uniqueName'] = async (ctx: ApiContext<ServiceIf>, { path, name }) => {
  const col = collection(ctx.service);
  return await nodefs.uniqueName(col, ctx.access, path, name);
};
