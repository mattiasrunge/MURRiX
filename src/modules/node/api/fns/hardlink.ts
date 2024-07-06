import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const hardlink: ApiIf['hardlink'] = async (ctx: ApiContext<ServiceIf>, { path, targetPath }) => {
  const col = collection(ctx.service);
  return await nodefs.hardlink(col, ctx.access, path, targetPath);
};
