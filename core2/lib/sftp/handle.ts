import { HandleId } from './handle-id.ts';
import { Disposables, DisposeFn } from '~/lib/disposables/mod.ts';

export class Handle {
  public id: HandleId;
  public pathname: string;
  private params: Record<string, any>;
  private disposables: Disposables;

  constructor(_what: 'file' | 'directory', pathname: string) {
    this.pathname = pathname;
    this.id = new HandleId();
    this.params = {};
    this.disposables = new Disposables();
  }

  public async release() {
    this.id.release();

    await this.disposables.destroy();
  }

  public setParam(name: string, value: any) {
    return this.params[name] = value;
  }

  public getParam(name: string) {
    return this.params[name];
  }

  public addDisposable(disposeFn: DisposeFn) {
    this.disposables.addDisposable(disposeFn);
  }
}
