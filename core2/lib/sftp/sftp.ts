import { SFTPWrapper, utils } from 'ssh2';
import { FileSystemIf } from './file-system-if.ts';
import { Connection } from './connection.ts';
import { Attributes } from './types.ts';

export const sftp = (fs: FileSystemIf, connection: Connection, stream: SFTPWrapper) => {
  connection.addStream(stream);

  connection.addAction('open', async (requestId: number, pathname: string, flags: number, attrs: Attributes) => {
    const handle = connection.createFileHandle(pathname);
    await fs.open(connection.client.session, handle, flags, attrs);

    return () => stream.handle(requestId, handle.id.encoded);
  });

  connection.addAction('write', async (_requestId: number, handleId: Buffer, offset: number, data: Buffer) => {
    const handle = connection.getHandle(handleId);
    await fs.write(connection.client.session, handle, offset, data);
  });

  connection.addAction('read', async (requestId: number, handleId: Buffer, offset: number, length: number) => {
    const handle = connection.getHandle(handleId);
    const data = await fs.read(connection.client.session, handle, offset, length);

    if (data) {
      return () => stream.data(requestId, data);
    }

    return utils.sftp.STATUS_CODE.EOF;
  });

  connection.addAction('fstat', async (requestId: number, handleId: Buffer) => {
    const handle = connection.getHandle(handleId);
    const attrs = await fs.stat(connection.client.session, handle.pathname);

    stream.attrs(requestId, attrs);

    return () => true; // TODO: continue on return false?
  });

  connection.addAction('fsetstat', async (_requestId: number, handleId: Buffer, attrs: Attributes) => {
    const handle = connection.getHandle(handleId);
    await fs.setstat(connection.client.session, handle.pathname, attrs);
  });

  connection.addAction('close', async (_requestId: number, handleId: Buffer) => {
    await connection.destroyHandle(handleId);
  });

  connection.addAction('opendir', async (requestId: number, pathname: string) => {
    const handle = connection.createDirectoryHandle(pathname);
    await fs.opendir(connection.client.session, handle, pathname);

    return () => stream.handle(requestId, handle.id.encoded);
  });

  connection.addAction('readdir', async (requestId: number, handleId: Buffer) => {
    const handle = connection.getHandle(handleId);
    const names = await fs.listdir(connection.client.session, handle);

    if (names) {
      return () => stream.name(requestId, names);
    }

    return utils.sftp.STATUS_CODE.EOF;
  });

  connection.addAction('lstat', async (requestId: number, pathname: string) => {
    const attrs = await fs.lstat(connection.client.session, pathname);

    stream.attrs(requestId, attrs);

    return () => true; // TODO: continue on return false?
  });

  connection.addAction('stat', async (requestId: number, pathname: string) => {
    const attrs = await fs.stat(connection.client.session, pathname);

    stream.attrs(requestId, attrs);

    return () => true; // TODO: continue on return false?
  });

  connection.addAction('remove', async (_requestId: number, pathname: string) => {
    await fs.remove(connection.client.session, pathname);
  });

  connection.addAction('rmdir', async (_requestId: number, pathname: string) => {
    await fs.rmdir(connection.client.session, pathname);
  });

  connection.addAction('realpath', async (requestId: number, pathname: string) => {
    const fileEntry = await fs.realpath(connection.client.session, pathname);

    return () => stream.name(requestId, [fileEntry]);
  });

  connection.addAction('readlink', async (requestId: number, pathname: string) => {
    const fileEntry = await fs.readlink(connection.client.session, pathname);

    return () => stream.name(requestId, [fileEntry]);
  });

  connection.addAction('setstat', async (_requestId: number, pathname: string, attrs) => {
    await fs.setstat(connection.client.session, pathname, attrs);
  });

  connection.addAction('mkdir', async (_requestId: number, pathname: string, attrs) => {
    await fs.mkdir(connection.client.session, pathname, attrs);
  });

  connection.addAction('rename', async (_requestId: number, oldPathname: string, newPathname: string) => {
    await fs.rename(connection.client.session, oldPathname, newPathname);
  });

  connection.addAction('symlink', async (_requestId: number, linkPathname: string, targetPathname: string) => {
    await fs.symlink(connection.client.session, targetPathname, linkPathname);
  });
};
