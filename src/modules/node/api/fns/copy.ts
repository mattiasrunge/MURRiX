import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const copy: ApiIf['copy'] = async (ctx: ApiContext<ServiceIf>, { srcPath, dstPath, inheritRights }) => {
  const col = collection(ctx.service);
  return await nodefs.copy(col, ctx.access, srcPath, dstPath, inheritRights);
};
