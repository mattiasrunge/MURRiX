import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { collection, nodefs } from '../../nodefs/mod.ts';
import { ApiIf } from '../if.ts';

export const update: ApiIf['update'] = async (ctx: ApiContext<ServiceIf>, { path, attrs }) => {
  const col = collection(ctx.service);
  const nodeData = await nodefs.resolveOne(col, ctx.access, path, {
    readlink: true,
  });

  return await nodefs.setAttrs(col, ctx.access, nodeData._id, attrs);
};
