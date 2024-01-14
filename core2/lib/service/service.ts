import { Disposables, DisposeFn } from '~/lib/disposables/mod.ts';
import { Log } from './log/mod.ts';
import { ServiceIf } from './types.ts';
import { App } from './app.ts';

export class Service implements ServiceIf {
  public readonly name: string;
  public readonly log: Log;
  public readonly instanceId = crypto.randomUUID();
  private disposables: Disposables;
  private app: App | null = null;

  private constructor(name: string) {
    this.name = name;
    this.log = new Log(name);
    this.disposables = new Disposables();

    globalThis.addEventListener('unload', () => this.stop());
  }

  static async create(name: string) {
    return new Service(name);
  }

  public addApp(app: App) {
    this.app = app;
  }

  public addDisposable(disposeFn: DisposeFn, ref?: any) {
    this.disposables.addDisposable(disposeFn, ref);
  }

  async stop() {
    try {
      this.app && (await this.app.stop());
      this.app = null;
      await this.disposables.destroy();
    } catch (error) {
      this.log.error('Failed to cleanup service', error);
    }
  }
}
