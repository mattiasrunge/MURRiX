import { ServiceIf } from './types.ts';

export abstract class Module {
  public service: ServiceIf;

  constructor(service: ServiceIf) {
    this.service = service;
  }

  public abstract setup(): Promise<void>;
  public async init() {}
  public async destroy() {}
}
