import { DisposeFn } from './types.ts';

export class Disposables {
  private registry: FinalizationRegistry<any>;
  private disposables = new Set<DisposeFn>();

  constructor() {
    this.registry = new FinalizationRegistry(this.cleanDisposable.bind(this));
  }

  async destroy() {
    const disposables = this.disposables.values();

    for (const disposeFn of disposables) {
      await this.cleanDisposable(disposeFn);
    }
  }

  private async cleanDisposable(disposeFn: DisposeFn) {
    try {
      this.disposables.delete(disposeFn);
      await disposeFn();
    } catch (error) {
      console.error('Failed to cleanup disposable', error);
    }
  }

  public addDisposable(disposeFn: DisposeFn, ref?: any) {
    this.disposables.add(disposeFn);
    ref && this.registry.register(ref, disposeFn);
  }
}
