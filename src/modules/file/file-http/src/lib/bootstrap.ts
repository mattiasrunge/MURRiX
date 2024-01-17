import { HttpServer } from '~/src/lib/http-server.ts';
import { StagingServer } from '~/src/lib/staging-server.ts';
import { initLog, log } from '~/src/lib/log.ts';
import { handlerCommit } from '~/src/lib/handlers/commit.ts';
import { handlerFileGet } from '~/src/lib/handlers/file-get.ts';
import { handlerFileInfo } from '~/src/lib/handlers/file-info.ts';
import { handlerFileVerify } from '~/src/lib/handlers/file-verify.ts';
import { handlerStaging } from '~/src/lib/handlers/staging.ts';
import { handlerFileRemove } from '~/src/lib/handlers/file-remove.ts';
import { run } from '~/src/lib/run.ts';

export type BootstrapOptions = {
  port: number;
  baseUrl: string;
  logfile?: string;
  filesDir: string;
  removedDir: string;
  stagingDir: string;
  stagingExpireMs?: number;
  stagingCleanupIntervalMs?: number;
  authorizedTokens: string[];
  maxIdIterations?: number;
};

const FILES_ROUTE = '/files';
const STAGING_ROUTE = '/staging';
const COMMIT_ROUTE = '/commit';
const DEFAULT_STAGING_EXPIRE_MS = 1000 * 60 * 60 * 24; // 24 hours
const DEFAULT_STAGING_CLEANUP_INTERVAL_MS = 1000 * 60 * 60 * 12; // 12 hours
const DEFAULT_MAX_ID_ITERATIONS = 10000;

export const bootstrap = async (opts: BootstrapOptions) => {
  await initLog(opts.logfile);

  log.info('*** Murrix File Server starting... ***');

  if (opts.logfile) {
    log.info(`Logfile is ${opts.logfile}`);
  }

  log.info(`Staging directory is ${opts.stagingDir}`);
  log.info(`Files directory is ${opts.filesDir}`);
  log.info(`Removed directory is ${opts.removedDir}`);

  log.info(`Found version ${(await run('exiftool', ['-ver'])).match(/(.*?)\n/)![1]} of exiftool`);
  log.info(`Found version ${(await run('file', ['-v'])).match(/file-(.*?)\n/)![1]} of file`);

  const httpServer = new HttpServer(opts.baseUrl, opts.port, opts.authorizedTokens);
  const stagingServer = new StagingServer(
    opts.stagingDir,
    STAGING_ROUTE,
    opts.stagingExpireMs || DEFAULT_STAGING_EXPIRE_MS,
    opts.stagingCleanupIntervalMs || DEFAULT_STAGING_CLEANUP_INTERVAL_MS,
  );

  httpServer.addRoute(['GET', 'HEAD'], `${FILES_ROUTE}/:id`, async (context) => {
    await handlerFileGet(context, context.params.id, {
      filesDir: opts.filesDir,
    });
  });

  httpServer.addRoute('GET', `${FILES_ROUTE}/:id/info`, async (context) => {
    await handlerFileInfo(context, context.params.id, {
      filesDir: opts.filesDir,
    });
  });

  httpServer.addRoute('GET', `${FILES_ROUTE}/:id/verify`, async (context) => {
    await handlerFileVerify(context, context.params.id, {
      filesDir: opts.filesDir,
    });
  });

  httpServer.addRoute('DELETE', `${FILES_ROUTE}/:id`, async (context) => {
    await handlerFileRemove(context, context.params.id, {
      filesDir: opts.filesDir,
      removedDir: opts.removedDir,
    });
  });

  httpServer.addRoute('POST', `${COMMIT_ROUTE}/:id`, async (context) => {
    await handlerCommit(context, context.params.id, context.request.headers.get('owner-id'), {
      stagingDir: opts.stagingDir,
      filesDir: opts.filesDir,
      maxIdIterations: opts.maxIdIterations || DEFAULT_MAX_ID_ITERATIONS,
    });
  });

  httpServer.addRoute(['HEAD', 'OPTIONS', 'PATCH', 'POST', 'DELETE'], `${STAGING_ROUTE}/:id?`, async (context) => {
    await handlerStaging(context, stagingServer);
  });

  await httpServer.listen();
  log.info(`Server is running on port ${opts.port}`);
  log.info(`Base url is ${opts.baseUrl}`);

  return {
    stop: async () => {
      try {
        await Promise.allSettled([
          httpServer.stop(),
          stagingServer.stop(),
        ]);
      } catch (error) {
        log.error(error);
      }
    },
    forceStagingCleanup: async () => {
      await stagingServer.cleanupExpired();
    },
  };
};
