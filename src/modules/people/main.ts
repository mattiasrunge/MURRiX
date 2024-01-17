import { ModuleUser } from './module.ts';

const config = JSON.parse(await Deno.readTextFile(Deno.args[0]));

await ModuleUser.create(config);
