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

export const ensure = api<I, O>(
  async (service: ServiceIf, { access, path, type, attrs, props }: I) => {
    const col = collection(service);
    try {
      return await nodefs.resolveOne(col, access, path);
    } catch {
      return await nodefs.make(col, access, path, type, attrs, props);
    }
  },
);
