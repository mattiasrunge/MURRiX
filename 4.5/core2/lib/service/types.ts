import { DisposeFn } from '~/lib/disposables/mod.ts';
import { Log } from './log/mod.ts';

export interface ServiceIf {
  readonly name: string;
  readonly log: Log;
  readonly instanceId: string;

  addDisposable(disposeFn: DisposeFn, ref?: any): void;
}
