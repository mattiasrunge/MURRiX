import { assert } from '@std/assert';
import { JSONValue } from '~/src/shared/types.ts';
import { SM } from '~/src/external/sm/mod.ts';

export class SharedData<T extends JSONValue> {
  private sm: SM;
  public readonly id: string;

  private constructor(sm: SM, id: string) {
    this.sm = sm;
    this.id = id;
  }

  static async peek<T extends JSONValue>(sm: SM, id: string, path?: string): Promise<T | null> {
    const exists = await sm.has(id);

    if (!exists) {
      return null;
    }

    const value = await sm.get(id, path);

    return value as T;
  }

  static async exists(sm: SM, id: string) {
    return await sm.has(id);
  }

  static async load<T extends JSONValue>(sm: SM, id: string) {
    const exists = await sm.has(id);
    assert(exists, `no data available for id ${id}`);

    return new SharedData<T>(sm, id);
  }

  static async create<T extends JSONValue>(sm: SM, id: string, data: T) {
    await sm.set(id, data);

    return new SharedData<T>(sm, id);
  }

  async set(data: JSONValue, path?: string) {
    const realPath = ['$', path].filter(Boolean).join('.');
    await this.sm.set(this.id, data, realPath);
  }

  async unset(path?: string) {
    const realPath = ['$', path].filter(Boolean).join('.');
    await this.sm.unset(this.id, realPath);
  }

  async get<X = T>(path?: string) {
    const realPath = ['$', path].filter(Boolean).join('.');
    const value = await this.sm.get(this.id, realPath);

    return value as X;
  }
}
