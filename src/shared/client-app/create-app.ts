import { join } from '@std/path';
import { BundleOptions } from './types.ts';
import { getBranch } from './get-branch.ts';
import { createAppFile } from './create-app-file.ts';

export const createApp = async (opts: BundleOptions, tmpdir: string) => {
  console.log('Creating app...\n');

  const imports: Record<string, string> = {};
  const branch = await getBranch('/', opts.appDir, opts.appDir, imports);
  const app = await createAppFile(branch, imports, opts.imports);
  const appFile = join(tmpdir, 'app.tsx');
  await Deno.writeTextFile(appFile, app);

  console.log('  app.tsx');

  // const command = new Deno.Command(Deno.execPath(), {
  //   args: [
  //     'fmt',
  //     appFile,
  //   ],
  // });

  // await command.output();

  // await Deno.copyFile(appFile, '__app.tsx');

  return appFile;
};
