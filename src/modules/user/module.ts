import { Module } from '~/src/shared/service/mod.ts';
import * as api from './api/mod.ts';

export class ModuleUser extends Module {
  async setup() {
    console.log(Object.entries(api));
    // await this.service.apiCallHandler(name, handler)(Object.values(api));
    // Register routes
    // Register events
    // Register shared memory
  }

  async init() {
    await api.init(this.service, {});
  }
}
