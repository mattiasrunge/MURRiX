import { join } from '@std/path';
import { FSFileInfoEx } from '~/src/external/fs/mod.ts';
import { apiNode, NamedNodeData } from '~/src/modules/node/mod.ts';
import { FileAttrs } from '../types.ts';
import { ApiContext } from '~/src/shared/api/types.ts';

export const makeFile = async (ctx: ApiContext, infoEx: FSFileInfoEx) => {
  // TODO: Fill out when, where and connect device

  return await apiNode.make(ctx, {
    path: join(infoEx.uploadMeta.path, infoEx.filename),
    type: 'f',
    attrs: {
      name: infoEx.filename,
      area: infoEx.area,
      fileId: infoEx.id,
      mimetype: infoEx.mimetype,
      size: infoEx.size,
      sha256: infoEx.sha256,
      meta: infoEx.fileMeta,
    } as FileAttrs,
  }) as NamedNodeData<FileAttrs>;
};
