import { join } from '@std/path';
import { BuildOptions } from '../types.ts';
import { getBranch } from './get-branch.ts';
import { compileAppTemplate } from './compile-app-template.ts';
import { compileIndexTemplate } from './compile-index-template.ts';
import { watch } from './watch.ts';

const generateApp = async (opts: BuildOptions, appDir: string) => {
  const appFile = join(opts.workDir, 'app.tsx');
  const imports: Record<string, string> = {};
  const branch = await getBranch('/', appDir, appDir, imports);
  const app = await compileAppTemplate(opts, branch, imports);
  await Deno.writeTextFile(appFile, app);
  // console.log('  app.tsx');

  return appFile;
};

const generateIndex = async (opts: BuildOptions) => {
  const indexFile = join(opts.distDir, 'index.html');
  const index = await compileIndexTemplate(opts);
  await Deno.writeTextFile(indexFile, index);
  // console.log('  index.html');
};

export const createApp = async (opts: BuildOptions) => {
  if (opts.dev) {
    console.log(`[watch] create app started`);
  } else {
    console.log('Create app started...');
  }

  await generateIndex(opts);

  const appDir = join(opts.srcDir, 'app');
  const appFile = await generateApp(opts, appDir);

  if (opts.dev) {
    console.log('[watch] create app finished, watching for changes...');
    watch(appDir, false, async (event: string, path: string) => {
      const relpath = path.replace(opts.srcDir, '');

      console.log(`[watch] create app started (${event}: "${relpath}")`);
      await generateApp(opts, appDir);
      console.log('[watch] create app finished');
    });
  }

  // const command = new Deno.Command(Deno.execPath(), {
  //   args: [
  //     'fmt',
  //     appFile,
  //   ],
  // });

  // await command.output();

  // await Deno.copyFile(appFile, '__app.tsx');

  if (!opts.dev) {
    console.log('Create app finished!');
  }

  return appFile;
};
