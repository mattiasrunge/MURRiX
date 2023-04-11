import { DisposeFn } from '~/layers/0_common/mod.ts';
import { NodeFS } from '~/layers/2_nodefs/mod.ts';
import { WrappedFunction } from '../wrap.ts';

export class API {
  public nodefs: NodeFS;
  private disposables = new Set<DisposeFn>();

  constructor(nodefs: NodeFS) {
    this.nodefs = nodefs;
  }

  static async create(nodefs: NodeFS, load: WrappedFunction[] = []) {
    const api = new API(nodefs);

    await api.load(load);

    return api;
  }

  private async load(load: WrappedFunction[]) {
    for (const fn of load) {
      const disposeFn = await fn.load(this);
      this.disposables.add(disposeFn);
    }
  }

  async destroy() {
    const disposables = this.disposables.values();

    for (const disposeFn of disposables) {
      try {
        this.disposables.delete(disposeFn);
        await disposeFn();
      } catch (error) {
        this.nodefs.phy.common.log.error('Failed to cleanup disposable', error);
      }
    }
  }
}
