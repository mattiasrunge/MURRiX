import { Service, ServiceConfig } from '~/src/shared/service/mod.ts';
import { ModuleNode } from './modules/node/module.ts';
import { ModuleUser } from './modules/user/module.ts';
import { ModulePeople } from './modules/people/module.ts';

const modules: Record<string, any> = {
  'node': ModuleNode,
  'user': ModuleUser,
  'people': ModulePeople,
};

const config = JSON.parse(await Deno.readTextFile(Deno.args[0])) as ServiceConfig;
await Service.create(config, modules);
