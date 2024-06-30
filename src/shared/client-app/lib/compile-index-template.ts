import { dirname, fromFileUrl, join } from '@std/path';
import { exists } from '@std/fs';
import { BuildOptions } from '../types.ts';

const VALID_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico'];

export const compileIndexTemplate = async (opts: BuildOptions): Promise<string> => {
  let template = await Deno.readTextFile(join(dirname(fromFileUrl(import.meta.url)), 'templates', 'index.html'));

  for (const ext of VALID_EXTENSIONS) {
    const faviconFile = join(opts.srcDir, 'app', `favicon${ext}`);

    if (await exists(faviconFile)) {
      template = template.replace('<!-- FAVICON -->', `<link rel="shortcut icon" href="/favicon${ext}">`);
      break;
    }
  }

  return template.replace('<!-- FAVICON -->', '');
};
