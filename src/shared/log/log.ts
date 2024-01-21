enum LogType {
  Info = 'INFO',
  Error = 'ERROR',
  Debug = 'DEBUG',
  Warning = 'WARN',
}

enum ArgType {
  String,
  Error,
  Object,
}

type DataDef = {
  type: ArgType;
  data: any;
};

const isErr = (e: unknown): e is Error => e instanceof Error;

const write = (type: LogType, name: string, msg: string, args: any[] = []) => {
  const date = new Date().toISOString();
  const dataList = args.map((data): DataDef => {
    if (isErr(data)) {
      return {
        type: ArgType.Error,
        data,
      };
    } else if (typeof data === 'object') {
      return {
        type: ArgType.Object,
        data,
      };
    }

    return {
      type: ArgType.String,
      data,
    };
  });

  const dataString = dataList
    .filter(({ type }) => type === ArgType.String || type === ArgType.Error)
    .filter(({ data }) => data)
    .map(({ data }) => `${data}`)
    .join(' ');

  const line = `${date}  ${type.toUpperCase().padEnd(5)}  ${name}  ${msg}  ${dataString}`;

  const errors = args
    .filter(isErr)
    .flatMap((data) => data?.stack?.split('\n'))
    .filter((l) => typeof l !== 'undefined');

  const objects = dataList
    .filter(({ type }) => type === ArgType.Object)
    .flatMap(({ data }) => JSON.stringify(data, null, 2).split('\n'));

  const lines = [
    line,
    ...objects,
    ...errors,
  ];

  for (const line of lines) {
    if (type === LogType.Error) {
      console.error(line);
    } else {
      console.log(line);
    }
  }
};

let appName = 'app';

const info = (msg: string, ...data: any[]) => {
  return write(LogType.Info, appName, msg, data);
};

const error = (msg: string, ...data: any[]) => {
  return write(LogType.Error, appName, msg, data);
};

const debug = (msg: string, ...data: any[]) => {
  return write(LogType.Debug, appName, msg, data);
};

const warn = (msg: string, ...data: any[]) => {
  return write(LogType.Warning, appName, msg, data);
};

const setName = (name: string) => {
  appName = name;
};

export const log = {
  info,
  error,
  debug,
  warn,
  setName,
};
