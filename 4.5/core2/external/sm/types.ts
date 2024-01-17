import { RedisConnectOptions } from 'redis';
import { JSONValue } from '~/lib/types.ts';

export type SMConfig = RedisConnectOptions;

export interface SMIf {
  has(id: string): Promise<boolean>;
  set(id: string, data: JSONValue, path?: string): Promise<void>;
  unset(id: string, path?: string): Promise<void>;
  get(id: string, path?: string): Promise<JSONValue>;
  appendToArray(id: string, data: JSONValue, path: string): Promise<void>;
  removeFromArray(id: string, data: JSONValue, path: string): Promise<void>;
  length(id: string, path?: string): Promise<number>;
}
