import { bootstrap, BootstrapOptions } from '~/src/lib/bootstrap.ts';
import { log } from '~/src/lib/log.ts';

const isDev = Deno.args[0] !== 'production';

const config: BootstrapOptions = isDev
  ? {
    port: 9090,
    baseUrl: 'http://localhost:9090',
    logfile: `${Deno.env.get('HOME')}/mfs/mfs-dev.log`,
    filesDir: `${Deno.env.get('HOME')}/mfs/files`,
    stagingDir: `${Deno.env.get('HOME')}/mfs/staging`,
    removedDir: `${Deno.env.get('HOME')}/mfs/removed`,
    authorizedTokens: ['token'],
  }
  : JSON.parse(await Deno.readTextFile('/data/config.json'));

const { stop } = await bootstrap(config);

Deno.addSignalListener('SIGINT', async () => {
  log.info('=> SIGINT received, shutting down...');
  await stop();
  Deno.exit();
});
