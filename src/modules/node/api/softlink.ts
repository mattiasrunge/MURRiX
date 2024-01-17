import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, NodeAttrs, NodeData, nodefs, NodePath, PartialNodeProps } from '../nodefs/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  targetPath: NodePath;
  type: string;
  attrs?: NodeAttrs;
  props?: PartialNodeProps;
};

type O = NodeData;

export const softlink = api<I, O>(
  async (service: ServiceIf, { access, path, targetPath, type, attrs, props }: I) => {
    const col = collection(service);
    return await nodefs.softlink(col, access, path, targetPath, type, attrs, props);
  },
);
