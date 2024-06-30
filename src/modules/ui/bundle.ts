import { dirname, fromFileUrl, join } from '@std/path';
import { build } from '~/src/shared/client-app/mod.ts';

import 'tslib';
import 'file-selector';

const workDir = await Deno.makeTempDir();
const distDir = join(dirname(fromFileUrl(import.meta.url)), '.dist');

await Deno.remove(distDir, { recursive: true });

await build({
  srcDir: join(dirname(fromFileUrl(import.meta.url)), 'client'),
  distDir,
  workDir,
  denoConfigPath: join(dirname(fromFileUrl(import.meta.url)), '../../../deno.jsonc'),
  alias: {
    'tslib': new URL(import.meta.resolve('tslib')).pathname,
    'file-selector': new URL(import.meta.resolve('file-selector')).pathname,
  },
  imports: [
    '@patternfly/react-core/dist/styles/base.css',
  ],
  dev: true,
});

Deno.addSignalListener('SIGINT', async () => {
  await Deno.remove(workDir, { recursive: true });
  Deno.exit(0);
});

Deno.addSignalListener('SIGTERM', async () => {
  await Deno.remove(workDir, { recursive: true });
  Deno.exit(0);
});
