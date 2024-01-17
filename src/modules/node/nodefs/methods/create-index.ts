import { Collection } from 'mongo';
import { NodeData } from '../types.ts';

export const createIndex = async (col: Collection<NodeData>) => {
  await col.createIndexes({
    indexes: [
      'type',
      'props.btime.timestamp',
      'props.children.name',
      'props.children.id',
      'props.link',
    ].map((name) => ({
      key: { [name]: 1 },
      name: name.replaceAll('.', '_'),
    })),
  });
};
