import { Module } from '~/src/shared/service/mod.ts';
import { getRequestExtras } from '~/src/shared/http-server/mod.ts';
import * as api from './api/mod.ts';
import { makeFile } from './filefs/mod.ts';

const AREA_NAME = 'archive';

export class ModuleFile extends Module {
  async setup() {
    await this.service.registerApiFunctions(Object.values(api));

    const area = await this.service.ensureFSArea(AREA_NAME, {
      hasRemoved: true,
      hasUpload: true,
    });

    area.setOnCommit(async (access, infoEx) => {
      const node = await makeFile(this.service, access, infoEx);

      return {
        'node-id': node._id,
        ...(node?.paths?.[0] ? { 'node-path': node.paths[0] } : {}),
      };
    });

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

    await this.service.addRoute(
      [
        'GET',
        'HEAD',
      ],
      `/file/${area.name}/:id`,
      async (context) => {
        await area.handleGet(context, context.params.id);
      },
    );

    // Register routes
    // Register events
    // Register shared memory
  }
}
