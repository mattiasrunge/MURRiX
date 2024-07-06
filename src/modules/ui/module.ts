import { dirname, fromFileUrl, join, normalize, resolve } from '@std/path';
import { exists } from '@std/fs';
import { Module } from '~/src/shared/service/mod.ts';
import { Client } from './client.ts';
import { log } from '~/src/shared/log/log.ts';
import { Access } from '~/src/shared/access/types.ts';

export class ModuleUi extends Module {
  async setup() {
    const myDir = dirname(fromFileUrl(import.meta.url));
    const clients: Client[] = [];

    await this.service.addRoute(
      [
        'GET',
      ],
      '/ws',
      async (context) => {
        if (!context.isUpgradable) {
          context.throw(501);
        }

        const ws = context.upgrade();

        const client = new Client(this.service, ws, context.state.access);
        clients.push(client);

        const ips = [context.request.ip, ...context.request.ips];

        ws.onopen = () => {
          log.info(`Client connected from: ${ips.join(', ')}`);

          client.open();
        };

        ws.onclose = () => {
          log.info(`Client disconnected from: ${ips.join(', ')}`);

          client.destroy();

          const index = clients.indexOf(client);
          if (index !== -1) {
            clients.splice(index, 1);
          }
        };
      },
    );

    await this.service.addRoute(
      [
        'GET',
        'HEAD',
      ],
      `/:path*`,
      async (context) => {
        const root = join(myDir, '.dist');
        let safePath = context.params.path ? normalize(context.params.path) : 'index.html';
        const absPath = resolve(root, safePath);

        if (!absPath.startsWith(root)) {
          context.throw(403);
          return;
        }

        if (!(await exists(absPath))) {
          const publicSafePath = join('public', safePath);

          if (await exists(resolve(root, publicSafePath))) {
            safePath = publicSafePath;
          } else {
            safePath = 'index.html';
          }
        }

        await context.send({
          root,
          path: safePath,
          index: 'index.html',
        });
      },
    );

    const unsubscribe = await this.service.subscribeToChannel('session', async (data) => {
      const access = data as Access;
      for (const client of clients) {
        if (client.sid === access.sid) {
          await client.sessionUpdated(access);
        }
      }
    });

    this.service.addDisposable(unsubscribe);

    if (this.service.isDev()) {
      const command = new Deno.Command(Deno.execPath(), {
        args: [
          'run',
          '--allow-env',
          '--allow-read',
          '--allow-write',
          '--allow-run',
          '--allow-ffi',
          '--allow-sys',
          join(myDir, 'bundle.ts'),
          '--dev',
        ],
      });

      const p = command.spawn();

      this.service.addDisposable(async () => {
        p.kill();
      });
    }

    // Register routes
    // Register events
    // Register shared memory
  }
}
