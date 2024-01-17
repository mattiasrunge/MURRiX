import { Service } from '~/src/shared/service/mod.ts';
import { ModuleUserConfig } from './types.ts';
import * as api from './api/mod.ts';

export class ModuleUser {
  public service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  static async create(config: ModuleUserConfig) {
    const service = await Service.create('user', config);
    const module = new ModuleUser(service);

    service.registerApiFunctions(Object.values(api));
    // Register routes
    // Register events
    // Register shared memory

    return module;
  }
}
