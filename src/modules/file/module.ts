import { Module } from '~/src/shared/service/mod.ts';
import { getRequestExtras } from '~/src/shared/http-server/mod.ts';
import * as api from './api/mod.ts';

export class ModuleFile extends Module {
  async setup() {
    await this.service.registerApiFunctions(Object.values(api));

    const uploadAreas = this.service.getFs().getAreas().filter((a) => a.hasUpload());

    for (const area of uploadAreas) {
      await this.service.addRoute(
        [
          'HEAD',
          'OPTIONS',
          'PATCH',
          'POST',
          'DELETE',
        ],
        `/file/${area.name}/upload/:id?`,
        async (context) => {
          const { incomingMessage, serverResponse } = getRequestExtras(context);
          await area.handleUpload(incomingMessage, serverResponse);
        },
      );
    }

    // Register routes
    // Register events
    // Register shared memory
  }
}
