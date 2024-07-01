import { dirname, fromFileUrl, join, normalize, resolve } from '@std/path';
import { exists } from '@std/fs';
import { Module } from '~/src/shared/service/mod.ts';

export class ModuleUi extends Module {
  async setup() {
    const myDir = dirname(fromFileUrl(import.meta.url));

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
          context.response.status = 403;
          context.response.body = 'Access Denied';
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
