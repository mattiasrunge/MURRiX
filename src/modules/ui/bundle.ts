import { join, resolve } from '@std/path';
import { build } from '~/src/shared/client-app/mod.ts';

import 'tslib';
import 'file-selector';

const distDir = resolve('.dist');
const clientDir = resolve('client');

await build({
  appDir: join(clientDir, 'app'),
  indexFile: join(clientDir, 'index.html'),
  staticDir: join(clientDir, 'static'),
  distDir,
  denoConfigPath: resolve('../../../deno.jsonc'),
  alias: {
    'tslib': new URL(import.meta.resolve('tslib')).pathname,
    'file-selector': new URL(import.meta.resolve('file-selector')).pathname,
  },
  imports: [
    '@patternfly/react-core/dist/styles/base.css',
  ],
  dev: true,
});
