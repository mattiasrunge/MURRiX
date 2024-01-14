import { assert } from 'std/_util/asserts.ts';
import { EventEmitter } from 'event';
import { AuthContext, Connection as SshConnection, Server as SshServer, Session as SshSession } from 'ssh2';
import { FileSystemIf } from './file-system-if.ts';
import { Connection } from './connection.ts';
import { sftp } from './sftp.ts';
import { Client, Events } from './types.ts';

export class Server extends EventEmitter<Events> {
  opts: any;
  fs: FileSystemIf;
  server: any;
  connections: any[];
  port: any;

  constructor(fs: FileSystemIf, opts = {}) {
    super();

    this.opts = opts;
    this.fs = fs;
    this.server = null;
    this.connections = [];
  }

  async start(keyFile: string, port: number) {
    assert(!this.server, 'Server already started');

    this.port = port;
    this.server = new SshServer({
      hostKeys: [
        await Deno.readTextFile(keyFile),
      ],
      ...this.opts,
    }, (sshCon: SshConnection) => this.onClient(sshCon));

    this.on('session-open', ({ connection, session }) => {
      session.on('sftp', (accept) => sftp(this.fs, connection, accept()));
    });

    return new Promise((r) => this.server.listen(this.port, r));
  }

  async stop() {
    this.off(); // Remove all event listeners

    for (const connection of this.connections) {
      await connection.close();
    }

    this.connections.length = 0;

    this.server && (await new Promise((resolve) => this.server.close(resolve)));
  }

  async destroyConnection(client: Client) {
    const connection = this.getConnection(client);

    if (connection) {
      this.connections.splice(this.connections.indexOf(connection), 1);

      await connection.close();

      this.emit('client-disconnected', connection);
    }
  }

  createConnection(client: Client) {
    const connection = new Connection(client);

    this.connections.push(connection);

    this.emit('client-connected', connection);

    return connection;
  }

  getConnection(client: Client) {
    return this.connections.find((s) => s.client === client);
  }

  onClient(sshCon: SshConnection) {
    const cs: Client = {
      sshConnection: sshCon,
      session: {},
    };

    sshCon.on('error', (error) => this.onError(error));
    sshCon.on('authentication', (ctx) => this.onAuthentication(cs, ctx));
    sshCon.on('end', () => this.onEnd(cs));
    // client.on('continue', () => this.onContinue(client));
    sshCon.on('ready', () => this.onReady(cs));
  }

  onError(error: Error) {
    this.emit('error', error);
  }

  async onAuthentication(client: Client, ctx: AuthContext) {
    try {
      const result = await this.fs.authenticate(client.session, ctx);

      // If current authentication method is not supported, an array of supported methods should be returned
      Array.isArray(result) && ctx.reject(result);

      ctx.accept();
    } catch {
      ctx.reject();
    }
  }

  onEnd(client: Client) {
    this.destroyConnection(client);
  }

  //   onContinue(client) {
  //     const connection = this.getConnection(client);

  //     connection && connection.canContinue();
  //   }

  onReady(client: Client) {
    const connection = this.createConnection(client);

    client.sshConnection.on('session', (accept) => this.onSession(connection, accept()));
  }

  onSession(connection: Connection, session: SshSession) {
    this.emit('session-open', { connection, session });
  }
}
