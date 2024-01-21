import { basename } from 'std/path/mod.ts';
import yargs from 'yargs/deno.ts';
import { Arguments } from 'yargs/deno-types.ts';
import { YargsInstance } from 'yargs/build/lib/yargs-factory.js';
import { uploadCreate } from '~/src/client/upload-create.ts';
import { uploadFile } from '~/src/client/upload-file.ts';
import { commit } from '~/src/client/commit.ts';
import { fileRemove } from '~/src/client/file-remove.ts';
import { fileInfo } from '~/src/client/file-info.ts';
import { fileVerify } from '~/src/client/file-verify.ts';

const assert = (res: Response, expected: number) => {
  if (res.status !== expected) {
    console.error(res.statusText);
    Deno.exit(1);
  }
};

const addHandler = async (token: string, url: string, ownerId: string, filePath: string) => {
  const postRes = await uploadCreate(token, url, filePath);
  const target = postRes.headers.get('location');
  assert(postRes, 201);

  const patchRes = await uploadFile(token, target!, filePath);
  assert(patchRes, 204);

  const stagedId = basename(target!);
  const commitRes = await commit(token, url, stagedId, ownerId);
  assert(commitRes, 200);
  const metadata = await commitRes.json();

  console.log(JSON.stringify(metadata, null, 2));
};

const infoHandler = async (token: string, url: string, fileId: string) => {
  const infoRes = await fileInfo(token, url, fileId);
  assert(infoRes, 200);
  const metadata = await infoRes.json();

  console.log(JSON.stringify(metadata, null, 2));
};

const verifyHandler = async (token: string, url: string, fileId: string) => {
  const verifyRes = await fileVerify(token, url, fileId);
  assert(verifyRes, 200);
  const verifyData = await verifyRes.json();

  console.log(JSON.stringify(verifyData, null, 2));
};

const removeHandler = async (token: string, url: string, fileId: string) => {
  const removeRes = await fileRemove(token, url, fileId);
  assert(removeRes, 200);

  console.log(JSON.stringify({ removed: true }, null, 2));
};

yargs(Deno.args)
  .usage('Usage: $0 <cmd> [options]')
  .command('add filepath', 'add a file', (yargs: YargsInstance) => {
    yargs.positional('filepath', {
      describe: 'Path to the file',
    });
    yargs.option('ownerid', {
      describe: 'Owner ID',
      demandOption: true,
      alias: 'o',
    });
  }, async (args: Arguments) => addHandler(args.token, args.url, args.ownerid, args.filepath))
  .command('info fileid', 'print file information', (yargs: YargsInstance) => {
    yargs.positional('fileid', {
      describe: 'Id of the file',
    });
  }, async (args: Arguments) => infoHandler(args.token, args.url, args.fileid))
  .command('verify fileid', 'verify file integrity', (yargs: YargsInstance) => {
    yargs.positional('fileid', {
      describe: 'Id of the file',
    });
  }, async (args: Arguments) => verifyHandler(args.token, args.url, args.fileid))
  .command('remove fileid', 'remove file', (yargs: YargsInstance) => {
    yargs.positional('fileid', {
      describe: 'Id of the file',
    });
  }, async (args: Arguments) => removeHandler(args.token, args.url, args.fileid))
  .demand('token')
  .alias('token', 't')
  .demand('url')
  .alias('url', 'u')
  .option('h', {
    alias: 'help',
    description: 'display help message',
  })
  .help('help')
  .showHelpOnFail(false, 'whoops, something went wrong! run with --help')
  .parse();
