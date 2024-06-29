import { Branch } from './types.ts';

export const createRoute = (branch: Branch): string => {
  let element = '<Outlet />';

  if (branch.layout) {
    element = `(
      <${branch.layout} path="${branch.name}">
        <Outlet />
      </${branch.layout}>
   )`;
  }

  const children = branch.children.map((b) => createRoute(b));

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
