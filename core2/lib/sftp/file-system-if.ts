import { OpUnsupportedError } from './errors.ts';
import { Handle } from './handle.ts';
import { Attributes, AuthRequest, FileEntry, Session } from './types.ts';

export abstract class FileSystemIf {
  async authenticate(_session: Session, _request: AuthRequest) {
    console.error('authenticate not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async open(_session: Session, _handle: Handle, _flags: number, _attrs: Attributes) {
    console.error('open not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async write(_session: Session, _handle: Handle, _offset: number, _data: Buffer) {
    console.error('write not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async read(_session: Session, _handle: Handle, _offset: number, _length: number): Promise<Buffer | undefined> {
    console.error('read not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async stat(_session: Session, _pathname: string): Promise<Attributes> {
    console.error('stat not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async lstat(_session: Session, _pathname: string): Promise<Attributes> {
    console.error('lstat not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async setstat(_session: Session, _pathname: string, _attrs: Attributes) {
    console.error('setstat not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async opendir(_session: Session, _handle: Handle, _pathname: string) {
    // Returns dirId
    console.error('open not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async listdir(_session: Session, _handle: Handle): Promise<FileEntry[] | undefined> {
    console.error('listdir not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async mkdir(_session: Session, _pathname: string, _attrs: Attributes) {
    console.error('mkdir not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async remove(_session: Session, _pathname: string) {
    console.error('remove not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async rmdir(_session: Session, _pathname: string) {
    console.error('rmdir not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async realpath(_session: Session, _pathname: string): Promise<FileEntry> {
    console.error('realpath not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async readlink(_session: Session, _pathname: string): Promise<FileEntry> {
    console.error('readlink not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async rename(_session: Session, _oldPathname: string, _newPathname: string) {
    console.error('rename not implemented');
    throw new OpUnsupportedError('Not implemented');
  }

  async symlink(_session: Session, _targetPathname: string, _linkPathname: string) {
    console.error('symlink not implemented');
    throw new OpUnsupportedError('Not implemented');
  }
}
