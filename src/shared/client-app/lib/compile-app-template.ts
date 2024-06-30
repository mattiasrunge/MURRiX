import { dirname, fromFileUrl, join } from '@std/path';
import { BuildOptions } from '../types.ts';
import { Branch } from './types.ts';

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
  ${branch.error ? `errorElement: <${branch.error} />,` : ''}
  }`;
};

export const compileAppTemplate = async (opts: BuildOptions, root: Branch, imports: Record<string, string>): Promise<string> => {
  const template = await Deno.readTextFile(join(dirname(fromFileUrl(import.meta.url)), 'templates', 'app.tsx'));

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

  return template.replace('// IMPORTS', importStr).replace('// ROUTES', routesStr);
};
