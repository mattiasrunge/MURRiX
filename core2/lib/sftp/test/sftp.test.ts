import { promisify } from 'https://deno.land/x/promisify/mod.ts';
import { assert, assertEquals } from 'std/testing/asserts.ts';
import { Attributes, Client, SFTPWrapper } from 'ssh2';
import { FileSystem } from './impl/file-system.ts';
import { Server } from '../server.ts';
import { join } from 'std/path/mod.ts';

// Define constants for file types
const S_IFIFO = 0o0010000; // FIFO/pipe
const S_IFCHR = 0o0020000; // Character device
const S_IFDIR = 0o0040000; // Directory
const S_IFBLK = 0o0060000; // Block device
const S_IFREG = 0o0100000; // Regular file
const S_IFLNK = 0o0120000; // Symbolic link
const S_IFSOCK = 0o0140000; // Socket

// Define S_IFMT as the mask for file types
const S_IFMT = 0o0170000; // File type mask

const stat = async (pathname: string) => {
  const attrs = await Deno.stat(pathname);

  return {
    mode: attrs.mode,
    uid: attrs.uid,
    gid: attrs.gid,
    size: attrs.size,
    atime: attrs.atime!.getTime(),
    mtime: attrs.mtime!.getTime(),
  } as Attributes;
};

const list = async (pathname: string) => {
  const entries = await Deno.readDir(pathname);
  const list = [];

  for await (const entry of entries) {
    const attrs = await stat(join(pathname, entry.name));

    list.push({
      filename: entry.name,
      longname: '',
      attrs,
    });
  }

  return list;
};

Deno.test({
  name: 'sftp',
  fn: async (t) => {
    let sftp: any;
    const rootpath = await Deno.makeTempDir();
    const username = 'userName';
    const password = 'passWord';
    const keyFile = new URL('./data/keys/id_rsa', import.meta.url);
    const server = new Server(new FileSystem(username, password));
    const connection = new Client();

    const port = 48265;

    // Bringup

    await server.start(keyFile.pathname, port);

    // Test steps

    await t.step('[connection]: should connect successfully', async () => {
      await new Promise<void>((resolve, reject) => {
        connection.once('ready', () => {
          connection.removeAllListeners('error');
          resolve();
        });

        connection.once('error', (error) => {
          connection.removeAllListeners('ready');
          reject(error);
        });

        connection.connect({
          host: 'localhost',
          port,
          username,
          password,
        });
      });
    });

    await t.step('[connection]: should start sftp subsystem successfully', async () => {
      const obj = await new Promise<SFTPWrapper>((resolve, reject) => {
        connection.sftp((error, sftp) => {
          if (error) {
            reject(error);
          }

          resolve(sftp);
        });
      });

      sftp = {
        readdir: promisify(obj.readdir).bind(obj),
        mkdir: promisify(obj.mkdir).bind(obj),
        rename: promisify(obj.rename).bind(obj),
        rmdir: promisify(obj.rmdir).bind(obj),
        stat: promisify(obj.stat).bind(obj),
        lstat: promisify(obj.lstat).bind(obj),
        realpath: promisify(obj.realpath).bind(obj),
        setstat: promisify(obj.setstat).bind(obj),
        symlink: promisify(obj.symlink).bind(obj),
        readlink: promisify(obj.readlink).bind(obj),
        open: promisify(obj.open).bind(obj),
        write: promisify(obj.write).bind(obj),
        read: promisify(obj.read).bind(obj),
        fstat: promisify(obj.fstat).bind(obj),
        fsetstat: promisify(obj.fsetstat).bind(obj),
        unlink: promisify(obj.unlink).bind(obj),
        close: promisify(obj.close).bind(obj),
      };
    });

    await t.step('[directory]: should list an empty directory successfully', async () => {
      const slist = await sftp.readdir(rootpath);

      const llist = await list(rootpath);
      assertEquals(llist.length, 0);
      assertEquals(slist, llist);
    });

    await t.step('[directory]: should create a directory successfully', async () => {
      await sftp.mkdir(join(rootpath, 'folder'));

      const llist = await list(rootpath);
      assertEquals(llist.length, 1);
      assertEquals(llist[0].filename, 'folder');
    });

    await t.step('[directory]: should stat a directory successfully', async () => {
      const attrs = await sftp.stat(join(rootpath, 'folder'));

      delete attrs.permissions;

      const llist = await list(rootpath);
      assertEquals(attrs, llist[0].attrs);
    });

    await t.step('[directory]: should set stat successfully', async () => {
      const pathname = join(rootpath, 'folder');
      const sattrs = {
        mode: 0o777,
        uid: 1000,
        gid: 1000,
        atime: 1000,
        mtime: 2000,
      };

      await sftp.setstat(pathname, sattrs);

      const lattrs = await stat(pathname);

      lattrs.mode = lattrs.mode & ~S_IFMT;

      assertEquals(sattrs, lattrs);
    });

    await t.step('[directory]: should rename a directory successfully', async () => {
      await sftp.rename(join(rootpath, 'folder'), join(rootpath, 'folder2'));

      const llist = await list(rootpath);
      assertEquals(llist.length, 1);
      assertEquals(llist[0].filename, 'folder2');
    });

    await t.step('[directory]: should remove a directory successfully', async () => {
      await sftp.rmdir(join(rootpath, 'folder2'));

      const llist = await list(rootpath);
      assertEquals(llist.length, 0);
    });

    await t.step('[symlink]: should create a symlink successfully', async () => {
      const pathname = join(rootpath, 'folder');
      const linkname = join(rootpath, 'folder_link');

      await sftp.mkdir(pathname);
      await sftp.symlink(pathname, linkname);

      const llist = await list(rootpath);
      assertEquals(llist.length, 2);
    });

    await t.step('[symlink]: should readlink successfully', async () => {
      const pathname = join(rootpath, 'folder');
      const linkname = join(rootpath, 'folder_link');

      const pn = await sftp.readlink(linkname);

      assertEquals(pn, pathname);
    });

    await t.step('[symlink]: should lstat a directory successfully', async () => {
      const attrs = await sftp.lstat(join(rootpath, 'folder'));

      delete attrs.permissions;

      const llist = await list(rootpath);
      assertEquals(attrs, llist[0].attrs);
    });

    await t.step('[file]: should write a file successfully', async () => {
      const filename = join(rootpath, 'file.txt');
      const content = Buffer.from('Hello World');

      const handle = await sftp.open(filename, 'w');

      await sftp.write(handle, content, 0, content.length, 0);

      await sftp.close(handle);
    });

    await t.step('[file]: should stat a file successfully', async () => {
      const filename = join(rootpath, 'file.txt');
      const attrs = await sftp.stat(filename);

      delete attrs.permissions;

      const llist = await list(rootpath);
      assertEquals(attrs, llist[0].attrs);
    });

    await t.step('[file]: should fstat a file successfully', async () => {
      const filename = join(rootpath, 'file.txt');
      const handle = await sftp.open(filename, 'r');

      const attrs = await sftp.fstat(handle);

      await sftp.close(handle);

      delete attrs.permissions;

      const llist = await list(rootpath);
      assertEquals(attrs, llist[0].attrs);
    });

    await t.step('[file]: should set stat successfully', async () => {
      const filename = join(rootpath, 'file.txt');
      const sattrs = {
        mode: 0o777,
        uid: 1000,
        gid: 1000,
        atime: 1000,
        mtime: 2000,
      };

      await sftp.setstat(filename, sattrs);

      const lattrs = await stat(filename);

      lattrs.mode = lattrs.mode & 0o777;

      assertEquals(sattrs, lattrs);
    });

    await t.step('[file]: should set fstat successfully', async () => {
      const filename = join(rootpath, 'file.txt');
      const handle = await sftp.open(filename, 'r');
      const sattrs = {
        mode: 0o777,
        uid: 1000,
        gid: 1000,
        atime: 1000,
        mtime: 2000,
      };

      await sftp.fsetstat(handle, sattrs);

      await sftp.close(handle);

      const lattrs = await stat(filename);

      lattrs.mode = lattrs.mode & 0o777;

      assertEquals(sattrs, lattrs);
    });

    await t.step('[file]: should read a file successfully', async () => {
      const filename = join(rootpath, 'file.txt');
      const handle = await sftp.open(filename, 'r');
      const content = Buffer.from('Hello World');
      const buffer = Buffer.alloc(content.length);

      await sftp.read(handle, buffer, 0, buffer.length, 0);

      await sftp.close(handle);

      assert(content.equals(buffer));
    });

    await t.step('[file]: should remove a file successfully', async () => {
      const filename = join(rootpath, 'file.txt');
      await sftp.unlink(filename);

      const llist = await list(rootpath);
      assertEquals(llist.length, 2);
    });

    await t.step('[other]: should call realpath successfully', async () => {
      const pathname = join(rootpath, 'folder2');
      await sftp.mkdir(pathname);
      const filepath = await sftp.realpath(join(rootpath, 'folder2', '..', 'folder2', '..', 'folder2'));
      await sftp.rmdir(pathname);

      assertEquals(filepath, pathname);
    });

    // Teardown

    await server.stop();
    await Deno.remove(rootpath);
  },
});
