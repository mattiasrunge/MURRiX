import { join } from 'std/path/mod.ts';
import { ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi } from '~/src/modules/node/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { FSFileInfoEx } from '~/src/external/fs/mod.ts';
import { FileAttrs } from '../types.ts';

export const makeFile = async (service: ServiceIf, access: Access, infoEx: FSFileInfoEx) => {
  // TODO: Fill out when, where and connect device

  return await nodeApi.make(service, {
    access,
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
