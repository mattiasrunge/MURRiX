import { dirname, fromFileUrl, join } from '@std/path';
import { build } from '~/src/shared/client-app/mod.ts';

import 'tslib';
import 'file-selector';

const myDir = dirname(fromFileUrl(import.meta.url));
const workDir = await Deno.makeTempDir();
const distDir = join(myDir, '.dist');

await build({
  srcDir: join(myDir, 'client'),
  distDir,
  workDir,
  denoConfigPath: join(myDir, '../../../deno.jsonc'),
  alias: {
    'tslib': new URL(import.meta.resolve('tslib')).pathname,
    'file-selector': new URL(import.meta.resolve('file-selector')).pathname,
  },
  imports: [
    '@patternfly/react-core/dist/styles/base.css',
  ],
  dev: Deno.args.includes('--dev'),
});

Deno.addSignalListener('SIGINT', async () => {
  await Deno.remove(workDir, { recursive: true });
  Deno.exit(0);
});

Deno.addSignalListener('SIGTERM', async () => {
  await Deno.remove(workDir, { recursive: true });
  Deno.exit(0);
});
