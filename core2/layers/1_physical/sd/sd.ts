import { assert } from 'std/testing/asserts.ts';
import { JSONValue } from '~/layers/0_common/mod.ts';
import { Physical } from '~/layers/1_physical/mod.ts';

// TODO: If this instance dies we should remove all
// of the shared data that it was subscribed to.

export class SharedData<T extends JSONValue> {
  private phy: Physical;
  public id: string;

  constructor(phy: Physical, id: string) {
    this.phy = phy;
    this.id = id;
  }

  static async peek<T extends JSONValue>(phy: Physical, id: string, path: string): Promise<T | null> {
    const exists = await phy.sm.has(id);
    if (!exists) {
      return null;
    }

    const value = await phy.sm.get(id, `$.data.${path}`);
    return value as T;
  }

  private static async instantiate<T extends JSONValue>(phy: Physical, id: string): Promise<SharedData<T>> {
    const sData = new SharedData<T>(phy, id);
    await phy.sm.appendToArray(id, phy.instanceId, '$.subs');

    return sData;
  }

  static async exists(phy: Physical, id: string): Promise<boolean> {
    return await phy.sm.has(id);
  }

  static async load<T extends JSONValue>(phy: Physical, id: string): Promise<SharedData<T>> {
    const exists = await phy.sm.has(id);
    assert(exists, `no data available for id ${id}`);

    return this.instantiate<T>(phy, id);
  }

  static async create<T extends JSONValue>(phy: Physical, id: string, data: T): Promise<SharedData<T>> {
    const exists = await phy.sm.has(id);

    if (exists) {
      await phy.sm.set(id, data, '$.data');
    } else {
      await phy.sm.set(id, { data, subs: [] });
    }

    return this.instantiate<T>(phy, id);
  }

  async connect(ref: any) {
    this.phy.addDisposable(ref, this.unload.bind(this));
  }

  async unload() {
    try {
      await this.phy.sm.removeFromArray(this.id, this.phy.instanceId, '$.subs');
      const subs = await this.phy.sm.get(this.id, '$.subs');

      if (subs && Object.keys(subs).length === 0) {
        await this.phy.sm.unset(this.id);
      }
    } catch {
      // Do nothing
    }
  }

  async set(data: JSONValue, path?: string) {
    const realPath = ['$', 'data', path].filter(Boolean).join('.');
    await this.phy.sm.set(this.id, data, realPath);
  }

  async unset(path?: string) {
    const realPath = ['$', 'data', path].filter(Boolean).join('.');
    await this.phy.sm.unset(this.id, realPath);
  }

  async get<T>(path?: string): Promise<T> {
    const realPath = ['$', 'data', path].filter(Boolean).join('.');
    const value = await this.phy.sm.get(this.id, realPath);

    return value as T;
  }
}
