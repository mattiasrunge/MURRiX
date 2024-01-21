import { assert } from 'std/assert/mod.ts';
import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi, NodePath } from '~/src/modules/node/mod.ts';
import { FSVerifyResult } from '~/src/external/fs/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { FileAttrs } from '../types.ts';

type I = {
  access: Access;
  nodePath: NodePath;
};

type O = FSVerifyResult;

export const verifyFile = api<I, O>(
  async (service: ServiceIf, { access, nodePath }) => {
    const node = await nodeApi.resolveOne(service, {
      access,
      path: nodePath,
    }) as NamedNodeData<FileAttrs>;

    assert(node.attrs.area, 'No file area associated with this node');
    assert(node.attrs.fileId, 'No file id associated with this node');

    const area = service.getFs().getArea(node.attrs.area);

    return await area.verify(node.attrs.fileId);
  },
);
