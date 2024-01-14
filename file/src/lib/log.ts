import * as log from 'std/log/mod.ts';

const MAX_BYTES = 10485760;
const MAX_BACKUP_COUNT = 50;

const formatter = (record: log.LogRecord) => {
  let msg = `${record.datetime.toISOString()}  ${record.levelName.padEnd(8, ' ')}  ${record.msg}`;

  if (record.args.length > 0) {
    for (const arg of record.args) {
      if (arg instanceof Error) {
        msg += `\n${(arg as Error).stack}`;
      } else {
        msg += `\n${JSON.stringify(arg, null, 2)}`;
      }
    }
  }

  return msg;
};

export const initLog = async (filename?: string) => {
  await log.setup({
    handlers: {
      console: new log.handlers.ConsoleHandler('DEBUG', {
        formatter,
        useColors: true,
      }),
      ...(
        filename
          ? {
            file: new log.handlers.RotatingFileHandler('INFO', {
              filename,
              maxBytes: MAX_BYTES,
              maxBackupCount: MAX_BACKUP_COUNT,
              formatter,
            }),
          }
          : {}
      ),
    },
    loggers: {
      default: {
        level: 'DEBUG',
        handlers: ['console', ...(filename ? ['file'] : [])],
      },
    },
  });
};

export { log };
