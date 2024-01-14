import { assert } from 'std/_util/asserts.ts';
// import { Deferred, deferred } from 'std/async/deferred.ts';
import { Handle } from './handle.ts';
import { HandleId } from './handle-id.ts';
import { SFTPWrapper, utils } from 'ssh2';
import { Client } from './types.ts';

export class Connection {
  client: Client;
  handles: any[];
  stream: SFTPWrapper | null;
  //   continueDeferred: Deferred<boolean>;

  constructor(client: Client) {
    this.client = client;
    this.handles = [];
    this.stream = null;
    // this.continueDeferred = deferred<boolean>();
    // this.continueDeferred.resolve(true);
  }

  //   async respond(fn) {
  //     await this.continueDeferred;

  //     !fn() && (this.continueDeferred = deferred<boolean>());
  //   }

  //   canContinue() {
  //     this.continueDeferred.resolve();
  //   }

  addStream(stream: SFTPWrapper) {
    this.stream = stream;
  }

  addAction(action: string, fn: (requestId: number, ...args: any[]) => any) {
    assert(this.stream, 'addStream must be called before addAction');

    this.stream.on(action.toUpperCase(), async (requestId: number, ...args: any[]) => {
      // console.error("action", action, ...args);
      try {
        const status = await fn(requestId, ...args);

        if (typeof status === 'undefined') {
          // await this.respond(() => this.stream.status(requestId, utils.sftp.STATUS_CODE.OK));
          this.stream!.status(requestId, utils.sftp.STATUS_CODE.OK);
        } else if (typeof status === 'function') {
          // await this.respond(status);
          status();
        } else {
          // await this.respond(() => this.stream.status(requestId, status));
          this.stream!.status(requestId, status);
        }
      } catch (error) {
        // console.error(`Error on action ${action}`, error);
        // await this.respond(() => this.stream.status(requestId, error.status || utils.sftp.STATUS_CODE.FAILURE, error.message));
        this.stream!.status(requestId, error.status || utils.sftp.STATUS_CODE.FAILURE, error.message);
      }
    });
  }

  createFileHandle(pathname: string) {
    const handle = new Handle('file', pathname);

    this.handles.push(handle);

    return handle;
  }

  createDirectoryHandle(pathname: string) {
    const handle = new Handle('directory', pathname);

    this.handles.push(handle);

    return handle;
  }

  getHandle(encodedId: Buffer) {
    const id = HandleId.decodeId(encodedId);
    const handle = this.handles.find((handle) => handle.id.unencoded === id);

    assert(handle, 'No handle found');

    return handle;
  }

  async destroyHandle(encodedId: Buffer) {
    const handle = this.getHandle(encodedId);

    if (handle) {
      this.handles.splice(this.handles.indexOf(handle), 1);

      await handle.release();
    }
  }

  async close() {
    for (const handle of this.handles) {
      await handle.release();
    }

    this.handles.length = 0;

    this.client.sshConnection.end();
  }
}
