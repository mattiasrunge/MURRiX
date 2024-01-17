import { ServiceIf } from '~/src/shared/service/mod.ts';
import { Password } from '../types.ts';

export const collection = (service: ServiceIf) => {
  return service.getDb().collection<Password>('passwords');
};
