import { Branch } from '../types.ts';

export const getBranch = async (name: string, dir: string, rootDir: string, imports: Record<string, string>): Promise<Branch> => {
  const id = dir.replace(rootDir, '').replaceAll(/\//g, '__');
  const branch: Branch = {
    name,
    children: [],
  };

  for await (const entry of Deno.readDir(dir)) {
    if (entry.isDirectory) {
      branch.children.push(await getBranch(entry.name, `${dir}/${entry.name}`, rootDir, imports));
    } else if (entry.isFile) {
      if (entry.name === 'page.tsx') {
        branch.page = `${id}__page`;
        imports[branch.page] = `${dir}/page.tsx`;
      } else if (entry.name === 'layout.tsx') {
        branch.layout = `${id}__layout`;
        imports[branch.layout] = `${dir}/layout.tsx`;
      } else if (entry.name === 'loader.tsx') {
        branch.loader = `${id}__loader`;
        imports[branch.loader] = `${dir}/loader.tsx`;
      } else if (entry.name === 'action.tsx') {
        branch.action = `${id}__action`;
        imports[branch.action] = `${dir}/action.tsx`;
      } else if (entry.name === 'error.tsx') {
        branch.error = `${id}__error`;
        imports[branch.error] = `${dir}/error.tsx`;
      }
    }
  }

  return branch;
};
