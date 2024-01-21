import { Module } from '~/src/shared/service/mod.ts';
import * as api from './api/mod.ts';

export class ModuleUser extends Module {
  async setup() {
    await this.service.registerApiFunctions(Object.values(api));
    // Register routes
    // Register events
    // Register shared memory
  }
}
