import { readLines } from 'std/io/mod.ts';

interface User {
  username: string;
  ipAddress: string;
}

export class SshServer {
  private serverProcess: Deno.Process | null = null;
  private connectedUsers: User[] = [];

  constructor(private readonly port: number, private readonly dataDir: string) {}

  public async start(): Promise<void> {
    if (this.serverProcess !== null) {
      throw new Error('SSH server is already running.');
    }

    // Start the SSH server process
    const args = [
      '-D', // Run in foreground
      '-e', // Log to standard error
      '-f',
      '/tmp/sshfs/sshd_config',
    ];
    this.serverProcess = Deno.run({
      cmd: [
        '/usr/sbin/sshd',
        ...args,
      ],
      stdout: 'piped',
      stderr: 'piped',
    });

    const pipeThrough = async (reader: Deno.Reader) => {
      for await (const output of readLines(reader)) {
        console.log(output);
        const connectMatch = output.match(/User (.+) from (.+)/);
        if (connectMatch) {
          const username = connectMatch[1];
          const ipAddress = connectMatch[2];
          this.connectedUsers.push({ username, ipAddress });
          console.log(`+Currently connected users:`, users);
        }
        const disconnectMatch = output.match(/Connection closed by (.+) \[preauth\]/);
        if (disconnectMatch) {
          const ipAddress = disconnectMatch[1];
          const index = this.connectedUsers.findIndex((user) => user.ipAddress === ipAddress);
          if (index >= 0) {
            this.connectedUsers.splice(index, 1);
            console.log(`-Currently connected users:`, users);
          }
        }
      }
    };

    pipeThrough(this.serverProcess.stdout!);
    pipeThrough(this.serverProcess.stderr!);

    await this.serverProcess.status();
    // Parse the server output for connected/disconnected users
    // this.serverProcess.stdout. .on("data", (data: Buffer) => {
    //   const output = data.toString();
    //   const connectMatch = output.match(/User (.+) from (.+)/);
    //   if (connectMatch) {
    //     const username = connectMatch[1];
    //     const ipAddress = connectMatch[2];
    //     this.connectedUsers.push({ username, ipAddress });
    //   }
    //   const disconnectMatch = output.match(/Connection closed by (.+) \[preauth\]/);
    //   if (disconnectMatch) {
    //     const ipAddress = disconnectMatch[1];
    //     const index = this.connectedUsers.findIndex((user) => user.ipAddress === ipAddress);
    //     if (index >= 0) {
    //       this.connectedUsers.splice(index, 1);
    //     }
    //   }
    // });

    // // Wait for the SSH server to start up
    // await new Promise((resolve, reject) => {
    //   this.serverProcess?.stdout?.on("data", (data: Buffer) => {
    //     if (data.includes("Server listening on")) {
    //       resolve();
    //     }
    //   });
    //   this.serverProcess?.on("error", (err: Error) => {
    //     reject(err);
    //   });
    // });
  }

  public async stop(): Promise<void> {
    if (this.serverProcess === null) {
      throw new Error('SSH server is not running.');
    }

    // Kill the SSH server process
    this.serverProcess.kill('SIGTERM');

    // // Wait for the process to exit
    // await new Promise((resolve) => {
    //   this.serverProcess?.on('exit', () => {
    //     this.serverProcess = null;
    //     resolve(null);
    //   });
    // });
  }

  public getConnectedUsers(): User[] {
    return this.connectedUsers;
  }
}

const server = new SshServer(22, '/data');
await server.start();
console.log('SSH server started.');
const users = server.getConnectedUsers();
console.log(`Currently connected users: ${users.length}`);
await server.stop();
console.log('SSH server stopped.');
