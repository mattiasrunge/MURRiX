import { IncomingMessage, ServerResponse } from 'node:http';
import { Server } from '@tus/server';
import { FileStore } from '@tus/file-store';
import { log } from '~/src/lib/log.ts';

export class StagingServer {
  private server: Server;
  private cleanUpIntervalId = 0;

  constructor(directory: string, route: string, expireMs: number, cleanupIntervalMs: number) {
    this.server = new Server({
      path: route,
      datastore: new FileStore({
        directory,
        expirationPeriodInMilliseconds: expireMs,
      }),
    });

    this.cleanUpIntervalId = setInterval(this.cleanupExpired.bind(this), cleanupIntervalMs);
  }

  public async cleanupExpired() {
    try {
      await this.server.cleanUpExpiredUploads();
    } catch (error) {
      log.error('[Staging] Failed to clean expired uploads', error);
    }
  }

  public async handle(req: IncomingMessage, res: ServerResponse) {
    await this.server.handle(req, res);
  }

  public async stop() {
    if (this.cleanUpIntervalId > 0) {
      clearInterval(this.cleanUpIntervalId);
      this.cleanUpIntervalId = 0;
    }
  }
}
