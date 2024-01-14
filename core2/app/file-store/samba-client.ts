import { execSync } from "deno";

class CifsMounter {
  private mountPoint: string;

  constructor(mountPoint: string) {
    this.mountPoint = mountPoint;
  }

  public mount(server: string, share: string, username: string, password: string): void {
    const mountCommand = `sudo mount -t cifs //${server}/${share} ${this.mountPoint} -o username=${username},password=${password}`;
    execSync(mountCommand);
  }

  public unmount(): void {
    const unmountCommand = `sudo umount ${this.mountPoint}`;
    execSync(unmountCommand);
  }
}
