import { join } from 'std/path/mod.ts';

type Share = {
  name: string;
  path: string;
};

export class SambaServer {
  private workingDir = '';
  private proc: Deno.Process | undefined;
  private port: number;
  private shares: Record<string, string> = {};

  constructor(port: number = 14567) {
    this.port = port;
  }

  async start() {
    if (this.proc) {
      throw new Error('samba daemon is already running');
    }

    this.workingDir = await Deno.makeTempDir({
      prefix: 'smb',
    });

    console.log('this.workingDir', this.workingDir);

    await this.writeConfig();

    const cmd = [
      'smbd',
      '--foreground',
      '-S',
      '--configfile',
      join(this.workingDir, 'smb.conf'),
      '--log-basename',
      this.workingDir,
      '--port',
      this.port.toString(),
    ];

    console.log('cmd', cmd.join(' '));
    this.proc = Deno.run({
      cmd,
      stdout: 'piped',
      stderr: 'piped',
    });

    console.log(this.proc);
  }

  async utilStopped() {
    if (!this.proc) {
      throw new Error('samba daemon is not running');
    }

    const { code } = await this.proc.status();
    this.proc = undefined;

    if (code !== null) {
      throw new Error(`samba daemon process exited with code ${code}`);
    }
  }

  async stop(): Promise<void> {
    if (!this.proc) {
      throw new Error('samba daemon is not running');
    }

    this.proc.close();
    const { code } = await this.proc.status();

    this.proc = undefined;
    // await Deno.remove(this.workingDir, { recursive: true });

    if (code !== null) {
      throw new Error(`samba daemon process exited with code ${code}`);
    }
  }

  public async addShare(path: string, name: string) {
    this.shares[name] = path;
    await this.writeConfig();
    await this.reloadConfig();
  }

  public async removeShare(name: string) {
    delete this.shares[name];
    await this.writeConfig();
    await this.reloadConfig();
  }

  private async reloadConfig() {
    if (!this.proc) {
      return;
    }

    this.proc.kill('SIGHUP');
  }

  private async writeConfig() {
    let content = '[global]\n';
    content += 'workgroup = FILE_STORE\n';
    // content += `port = ${this.port}\n`;
    content += `interfaces = lo 127.0.0.0/8\n`;
    content += `smb ports = 1445\n`;
    content += `log level = 4\n`;
    content += `map to guest = Bad User\n`;
    content += `passdb backend = smbpasswd\n`;
    content += `smb passwd file = /tmp/samba/smbpasswd\n`;
    content += `lock directory = /tmp/samba\n`;
    content += `state directory = /tmp/samba\n`;
    content += `cache directory = /tmp/samba\n`;
    content += `pid directory = /tmp/samba\n`;
    content += `private dir = /tmp/samba\n`;
    content += `ncalrpc dir = /tmp/samba\n`;
    content += '\n';

    for (const [name, path] of Object.entries(this.shares)) {
      content += `[${name}]\n`;
      content += `path = ${path}\n`;
      content += 'valid users = @smbusers\n';
      content += 'guest ok = yes\n';
      content += 'writable = yes\n';
      content += '\n';
    }

    await Deno.writeTextFile(join(this.workingDir, 'smb.conf'), content);
  }
}
