import { Module } from '~/src/shared/service/mod.ts';
import * as api from './api/mod.ts';

export class ModulePeople extends Module {
  async setup() {
    await this.service.registerApiFunctions(Object.values(api));
    // Register routes
    // Register events
    // Register shared memory
  }

  async init() {
    await api.init(this.service, {});
  }
}
