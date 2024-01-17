import { api, ServiceIf } from '~/src/shared/service/mod.ts';
import { Access } from '~/src/shared/access/mod.ts';
import { JSONValue } from '~/src/shared/types.ts';
import { collection, NodeData, nodefs } from '../nodefs/mod.ts';

type I = {
  access: Access;
  query: Record<string, JSONValue>;
};

type O = NodeData;

export const findOne = api<I, O>(
  async (service: ServiceIf, { access, query }: I) => {
    const col = collection(service);
    return await nodefs.findOne(col, access, query);
  },
);
