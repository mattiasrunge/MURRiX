import { assert } from 'std/_util/asserts.ts';
import { JSONValue } from '~/lib/types.ts';
import { Service } from '~/lib/service/mod.ts';
import { SMIf } from '../types.ts';

// TODO: If this instance dies we should remove all
// of the shared data that it was subscribed to.

export class SharedData<T extends JSONValue> {
  private sm: SMIf;
  private service: Service;
  public readonly id: string;

  constructor(service: Service, sm: SMIf, id: string) {
    this.sm = sm;
    this.id = id;
    this.service = service;
  }

  static async peek<T extends JSONValue>(sm: SMIf, id: string, path: string): Promise<T | null> {
    const exists = await sm.has(id);
    if (!exists) {
      return null;
    }

    const value = await sm.get(id, `$.data.${path}`);
    return value as T;
  }

  static async exists(sm: SMIf, id: string): Promise<boolean> {
    return await sm.has(id);
  }

  private static async instantiate<T extends JSONValue>(service: Service, sm: SMIf, id: string): Promise<SharedData<T>> {
    const sData = new SharedData<T>(service, sm, id);
    await sm.appendToArray(id, service.instanceId, '$.subs');

    return sData;
  }

  static async load<T extends JSONValue>(service: Service, sm: SMIf, id: string): Promise<SharedData<T>> {
    const exists = await sm.has(id);
    assert(exists, `no data available for id ${id}`);

    return this.instantiate<T>(service, sm, id);
  }

  static async create<T extends JSONValue>(service: Service, sm: SMIf, id: string, data: T): Promise<SharedData<T>> {
    const exists = await sm.has(id);

    if (exists) {
      await sm.set(id, data, '$.data');
    } else {
      await sm.set(id, { data, subs: [] });
    }

    return this.instantiate<T>(service, sm, id);
  }

  async connect(ref: any) {
    this.service.addDisposable(this.unload.bind(this), ref);
  }

  async unload() {
    try {
      await this.sm.removeFromArray(this.id, this.service.instanceId, '$.subs');
      const subs = await this.sm.get(this.id, '$.subs');

      if (subs && Object.keys(subs).length === 0) {
        await this.sm.unset(this.id);
      }
    } catch {
      // Do nothing
    }
  }

  async set(data: JSONValue, path?: string) {
    const realPath = ['$', 'data', path].filter(Boolean).join('.');
    await this.sm.set(this.id, data, realPath);
  }

  async unset(path?: string) {
    const realPath = ['$', 'data', path].filter(Boolean).join('.');
    await this.sm.unset(this.id, realPath);
  }

  async get<T>(path?: string): Promise<T> {
    const realPath = ['$', 'data', path].filter(Boolean).join('.');
    const value = await this.sm.get(this.id, realPath);

    return value as T;
  }
}
