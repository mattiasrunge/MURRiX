import { GroupId, UserId } from '~/src/shared/mode/mod.ts';
import { SharedData } from '~/src/shared/shared-data/mod.ts';
import { Access, GUEST_GID, GUEST_UID } from '~/src/shared/access/mod.ts';
import { ServiceIf } from '~/src/shared/service/types.ts';

export class Session {
  private data: SharedData<Access>;
  private service: ServiceIf;

  private constructor(service: ServiceIf, data: SharedData<Access>) {
    this.service = service;
    this.data = data;
  }

  static async create(service: ServiceIf, sid?: string) {
    const exists = sid && (await SharedData.exists(service.getSm(), sid));

    if (exists) {
      const data = await SharedData.load<Access>(service.getSm(), sid);

      return new Session(service, data);
    }

    // TODO: Session should have timeout

    const access: Access = {
      sid: crypto.randomUUID(),
      uid: GUEST_UID,
      gids: [GUEST_GID],
    };

    const data = await SharedData.create<Access>(service.getSm(), access.sid!, access);

    return new Session(service, data);
  }

  private async notify() {
    await this.service.publishToChannel('session', await this.data.get());
  }

  get sid() {
    return this.data.id;
  }

  access() {
    return this.data.get();
  }

  async grantAdmin() {
    await this.data.set(true, 'admin');
    await this.notify();
  }

  async revokeAdmin() {
    await this.data.unset('admin');
    await this.notify();
  }

  async login(uid: UserId, gids: GroupId[]) {
    await this.data.unset('admin');
    await this.data.set(uid, 'uid');
    await this.data.set(gids, 'gids');
    await this.notify();
  }

  async logout() {
    await this.data.unset('admin');
    await this.data.set(GUEST_UID, 'uid');
    await this.data.set([GUEST_GID], 'gids');
    await this.notify();
  }
}
