import { dirname, fromFileUrl, join } from '@std/path';
import { exists } from '@std/fs';
import { InternalOptions } from '../types.ts';

const VALID_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico'];

export const generateIndex = async (opts: InternalOptions) => {
  const templateFile = join(dirname(fromFileUrl(import.meta.url)), 'templates', 'index.html');
  const indexFile = join(opts.distDir, 'index.html');
  const watchFiles: string[] = [];

  let template = await Deno.readTextFile(templateFile);

  for (const ext of VALID_EXTENSIONS) {
    const faviconFile = join(opts.srcDir, 'app', `favicon${ext}`);

    if (await exists(faviconFile)) {
      template = template.replace('<!-- FAVICON -->', `<link rel="shortcut icon" href="/favicon${ext}">`);
      await Deno.copyFile(faviconFile, join(opts.distDir, `favicon${ext}`));
      watchFiles.push(faviconFile);
      break;
    }
  }

  const styleFile = join(opts.srcDir, 'app', `style.css`);

  if (await exists(styleFile)) {
    template = template.replace('<!-- STYLE -->', `<link rel="stylesheet" href="/style.css">`);
    await Deno.copyFile(styleFile, join(opts.distDir, 'style.css'));
    watchFiles.push(styleFile);
  }

  const content = template.replace('<!-- FAVICON -->', '').replace('<!-- STYLE -->', '');

  await Deno.writeTextFile(indexFile, content);

  return watchFiles;
};
