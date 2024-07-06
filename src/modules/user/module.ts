import { Module } from '~/src/shared/service/mod.ts';
import { ApiFunction } from '~/src/shared/api/types.ts';
import { ADMIN_ACCESS } from '~/src/shared/access/mod.ts';
import * as api from './api/fns.ts';
import { init } from './init.ts';

export class ModuleUser extends Module {
  async setup() {
    for (const [name, handler] of Object.entries(api)) {
      await this.service.callHandler(`user.${name}`, handler as ApiFunction);
    }
  }

  async init() {
    await init({
      connection: this.service,
      access: ADMIN_ACCESS,
      service: this.service,
    });
  }
}
