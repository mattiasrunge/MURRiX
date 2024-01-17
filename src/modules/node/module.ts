import { Service } from '~/src/shared/service/mod.ts';
import { ModuleNodeConfig } from './types.ts';
import * as api from './api/mod.ts';

export class ModuleNode {
  public service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  static async create(config: ModuleNodeConfig) {
    const service = await Service.create('node', config);
    const module = new ModuleNode(service);

    service.registerApiFunctions(Object.values(api));
    // Register routes
    // Register events
    // Register shared memory

    return module;
  }
}
