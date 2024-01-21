import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { collection, nodefs, NodeId } from '../nodefs/mod.ts';

type I = {
  access: Access;
  id: NodeId;
};

type O = boolean;

export const removeById = api<I, O>(
  async (service: ServiceIf, { access, id }: I) => {
    const col = collection(service);
    return await nodefs.removeById(col, access, id);
  },
);
