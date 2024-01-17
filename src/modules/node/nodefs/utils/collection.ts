import { ServiceIf } from '~/src/shared/service/mod.ts';
import { NodeData } from '../types.ts';

export const collection = (service: ServiceIf) => {
  return service.getDb().collection<NodeData>('nodes');
};
