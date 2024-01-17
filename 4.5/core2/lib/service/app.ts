import { ServiceIf } from './types.ts';

export abstract class App {
  protected service: ServiceIf;

  constructor(service: ServiceIf) {
    this.service = service;
  }

  abstract stop(): Promise<void>;
}
