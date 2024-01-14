import { basename, join } from 'std/path/mod.ts';
import { FileSystemIf } from '../../file-system-if.ts';
import { PermissionDeniedError } from '../../errors.ts';
import { Attributes, AuthRequest, FileEntry, Session } from '../../types.ts';
import { Handle } from '../../handle.ts';
import { flagsToOpenOpts, longname } from '../../utils.ts';

const isset = (value: any) => typeof value !== 'undefined';

export class FileSystem extends FileSystemIf {
  private username: string;
  private password: string;

  constructor(username: string, password: string) {
    super();

    this.username = username;
    this.password = password;
  }

  async authenticate(_session: Session, request: AuthRequest) {
    if (
      request.method !== 'password' ||
      request.username !== this.username ||
      request.password !== this.password
    ) {
      throw new PermissionDeniedError();
    }
  }

  async opendir(_session: Session, handle: Handle) {
    handle.setParam('eof', false);
  }

  async open(_session: Session, handle: Handle, flags: number, _attrs: Attributes) {
    const { rid } = await Deno.open(handle.pathname, flagsToOpenOpts(flags));

    handle.setParam('id', rid);
    handle.addDisposable(async () => await Deno.close(rid));
  }

  async stat(_session: Session, pathname: string) {
    const attrs = await Deno.stat(pathname);

    return {
      mode: attrs.mode,
      uid: attrs.uid,
      gid: attrs.gid,
      size: attrs.size,
      atime: attrs.atime!.getTime(),
      mtime: attrs.mtime!.getTime(),
    } as Attributes;
  }

  async lstat(_session: Session, pathname: string) {
    const attrs = await Deno.lstat(pathname);

    return {
      mode: attrs.mode,
      uid: attrs.uid,
      gid: attrs.gid,
      size: attrs.size,
      atime: attrs.atime!.getTime(),
      mtime: attrs.mtime!.getTime(),
    } as Attributes;
  }

  async write(_session: Session, handle: Handle, offset: number, data: Buffer) {
    const id = handle.getParam('id');

    await Deno.seek(id, offset, Deno.SeekMode.Start);
    await Deno.write(id, data);
  }

  async read(_session: Session, handle: Handle, offset: number, length: number) {
    const id = handle.getParam('id');
    const attrs = await Deno.fstat(id);

    if (offset >= attrs.size) {
      return;
    }

    const buffer = Buffer.alloc(length);
    await Deno.seek(id, offset, Deno.SeekMode.Start);
    const bytesRead = await Deno.read(id, buffer);

    return buffer.slice(0, bytesRead || 0);
  }

  async listdir(session: Session, handle: Handle) {
    if (handle.getParam('eof')) {
      return;
    }

    const list: FileEntry[] = [];
    const entries = await Deno.readDir(handle.pathname);

    for await (const entry of entries) {
      const attrs = await this.lstat(session, join(handle.pathname, entry.name));
      const num = 1; // TODO: Number of links and directories inside this directory

      list.push({
        filename: entry.name,
        longname: longname(entry.name, entry, attrs, num),
        attrs,
      });
    }

    handle.setParam('eof', true);

    return list;
  }

  async mkdir(session: Session, pathname: string, attrs: Attributes) {
    await Deno.mkdir(pathname);
    await this.setstat(session, pathname, {
      mode: attrs.mode,
      uid: attrs.uid,
      gid: attrs.gid,
      atime: attrs.atime,
      mtime: attrs.mtime,
    });
  }

  async setstat(_session: Session, pathname: string, attrs: Partial<Attributes>) {
    if (attrs.mode && isset(attrs.mode)) {
      await Deno.chmod(pathname, attrs.mode);
    }

    if (isset(attrs.uid) || isset(attrs.gid)) {
      await Deno.chown(pathname, attrs.uid || null, attrs.gid || null);
    }

    if (isset(attrs.atime) && isset(attrs.mtime)) {
      await Deno.utime(pathname, attrs.atime!, attrs.mtime!);
    }
  }

  async rename(_session: Session, oldPathname: string, newPathname: string) {
    await Deno.rename(oldPathname, newPathname);
  }

  async rmdir(_session: Session, pathname: string) {
    await Deno.remove(pathname, { recursive: true });
  }

  async remove(_session: Session, pathname: string) {
    await Deno.remove(pathname);
  }

  async realpath(_session: Session, pathname: string) {
    const realpath = await Deno.realPath(pathname);
    const entry = await Deno.stat(realpath);
    const attrs: Attributes = {
      mode: entry.mode!,
      uid: entry.uid!,
      gid: entry.gid!,
      size: entry.size,
      atime: entry.atime!.getTime(),
      mtime: entry.mtime!.getTime(),
    };
    const num = 1; // TODO: Number of links and directories inside this directory
    const filename = basename(realpath);

    return {
      filename,
      longname: longname(filename, entry, attrs, num),
      attrs,
    };
  }

  async readlink(_session: Session, pathname: string) {
    const realpath = await Deno.readLink(pathname);
    const entry = await Deno.stat(realpath);
    const attrs: Attributes = {
      mode: entry.mode!,
      uid: entry.uid!,
      gid: entry.gid!,
      size: entry.size,
      atime: entry.atime!.getTime(),
      mtime: entry.mtime!.getTime(),
    };
    const num = 1; // TODO: Number of links and directories inside this directory
    const filename = basename(realpath);

    return {
      filename,
      longname: longname(filename, entry, attrs, num),
      attrs,
    };
  }

  async symlink(_session: Session, targetPathname: string, linkPathname: string) {
    return await Deno.symlink(targetPathname, linkPathname);
  }
}
