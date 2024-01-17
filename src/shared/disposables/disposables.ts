import { Disposable } from './types.ts';

export class Disposables {
  private registry: FinalizationRegistry<any>;
  private disposables = new Set<Disposable>();

  constructor() {
    this.registry = new FinalizationRegistry(this.cleanDisposable.bind(this));
  }

  async destroy() {
    const disposables = [...this.disposables.values()].reverse();

    for (const disposable of disposables) {
      await this.cleanDisposable(disposable);
    }
  }

  private async cleanDisposable(disposable: Disposable) {
    try {
      this.disposables.delete(disposable);
      if (typeof disposable === 'function') {
        await disposable();
      } else if (disposable?.destroy) {
        await disposable.destroy();
      }
    } catch (error) {
      console.error('Failed to cleanup disposable', error);
    }
  }

  public addDisposable(disposeFn: Disposable, ref?: any) {
    this.disposables.add(disposeFn);
    ref && this.registry.register(ref, disposeFn);
  }
}
