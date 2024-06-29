import { dirname, fromFileUrl, join } from '@std/path';
import { Branch } from './types.ts';
import { createRoute } from './create-route.ts';

export const createAppFile = async (root: Branch, imports: Record<string, string>, staticImports?: string[]): Promise<string> => {
  const template = await Deno.readTextFile(join(dirname(fromFileUrl(import.meta.url)), 'app.tsx'));

  // Imports
  let importStr = '';

  for (const value of (staticImports || [])) {
    importStr += `import '${value}';\n`;
  }

  for (const [key, value] of Object.entries(imports)) {
    importStr += `import ${key} from '${value}';\n`;
  }

  // Routes
  const routesStr = `
  routes = [
    ${createRoute(root)}
  ];
  `;

  return template.replace('// IMPORTS', importStr).replace('// ROUTES', routesStr);
};
