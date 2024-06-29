import { assert } from '@std/assert';
import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { NamedNodeData, nodeApi, NodePath } from '~/src/modules/node/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { FileAttrs } from '../types.ts';
import { JSONValue } from '~/src/shared/types.ts';

type I = {
  access: Access;
  nodePath: NodePath;
};

type O = Record<string, JSONValue>;

export const readFileMetadata = api<I, O>(
  async (service: ServiceIf, { access, nodePath }) => {
    const node = await nodeApi.resolveOne(service, {
      access,
      path: nodePath,
    }) as NamedNodeData<FileAttrs>;

    assert(node.attrs.area, 'No file area associated with this node');
    assert(node.attrs.fileId, 'No file id associated with this node');

    const area = service.getFSArea(node.attrs.area);

    return await area.getRawMetadata(node.attrs.fileId);
  },
);
