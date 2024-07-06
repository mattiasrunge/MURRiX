import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const softlink: ApiIf['softlink'] = async (ctx: ApiContext<ServiceIf>, { path, targetPath, type, attrs, props }) => {
  const col = collection(ctx.service);
  return await nodefs.softlink(col, ctx.access, path, targetPath, type, attrs, props);
};
