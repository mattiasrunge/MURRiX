import { dirname, fromFileUrl, join } from '@std/path';
import { Branch, InternalOptions } from '../types.ts';
import { getBranch } from './get-branch.ts';

const compileRoute = (branch: Branch): string => {
  let element = '<Outlet />';

  if (branch.layout) {
    element = `(
      <${branch.layout} path="${branch.name}">
        <Outlet />
      </${branch.layout}>
   )`;
  }

  const children = branch.children.map((b) => compileRoute(b));

  if (branch.page) {
    if (children.length === 0) {
      element = `<${branch.page} />`;
    } else {
      children.push(`{
      index: true,
      element: <${branch.page} />
    }`);
    }
  }

  let error = '';

  if (branch.error) {
    if (branch.layout) {
      error = `(
      <${branch.layout} path="${branch.name}">
        <${branch.error} />
      </${branch.layout}>
    )`;
    } else {
      error = `<${branch.error} />`;
    }
  }

  return `{
    path: '${branch.name}',
    element: ${element},
    ${
    children.length === 0 ? '' : `
    children: [
      ${children.join(',\n')}
    ],`
  }
  ${branch.loader ? `loader: ${branch.loader},` : ''}
  ${branch.action ? `action: ${branch.action},` : ''}
  ${error ? `errorElement: ${error},` : ''}
  }`;
};

export const generateEntryPoint = async (opts: InternalOptions) => {
  const templateFile = join(dirname(fromFileUrl(import.meta.url)), 'templates', 'app.tsx');
  const appDir = join(opts.srcDir, 'app');
  const watchFiles: string[] = [appDir];

  const imports: Record<string, string> = {};
  const root = await getBranch('/', appDir, appDir, imports);
  const template = await Deno.readTextFile(templateFile);

  // Imports
  let importStr = '';

  for (const value of (opts.imports || [])) {
    importStr += `import '${value}';\n`;
  }

  for (const [key, value] of Object.entries(imports)) {
    importStr += `import ${key} from '${value}';\n`;
  }

  // Routes
  const routesStr = `
  routes = [
    ${compileRoute(root)}
  ];
  `;

  const content = template.replace('// IMPORTS', importStr).replace('// ROUTES', routesStr);

  await Deno.writeTextFile(opts.appFile, content);

  return watchFiles;
};
