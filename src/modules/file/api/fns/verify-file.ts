import { assert } from '@std/assert';
import { ServiceIf } from '~/src/shared/service/mod.ts';
import { ApiContext } from '~/src/shared/api/types.ts';
import { apiNode, NamedNodeData } from '~/src/modules/node/mod.ts';
import { FileAttrs } from '../../types.ts';
import { ApiIf } from '../if.ts';

export const verifyFile: ApiIf['verifyFile'] = async (ctx: ApiContext<ServiceIf>, { nodePath }) => {
  const node = await apiNode.resolveOne(ctx, {
    path: nodePath,
  }) as NamedNodeData<FileAttrs>;

  assert(node.attrs.area, 'No file area associated with this node');
  assert(node.attrs.fileId, 'No file id associated with this node');

  const area = ctx.service.getFSArea(node.attrs.area);

  return await area.verify(node.attrs.fileId);
};
