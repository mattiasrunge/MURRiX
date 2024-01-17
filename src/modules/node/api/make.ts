import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, NamedNodeData, NodeAttrs, nodefs, NodePath, PartialNodeProps } from '../nodefs/mod.ts';

type I = {
  access: Access;
  path: NodePath;
  type: string;
  attrs?: NodeAttrs;
  props?: PartialNodeProps;
};

type O = NamedNodeData;

export const make = api<I, O>(
  async (service: ServiceIf, { access, path, type, attrs, props }: I) => {
    const col = collection(service);
    return await nodefs.make(col, access, path, type, attrs, props);
  },
);
