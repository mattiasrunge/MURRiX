import { SM } from '~/src/external/sm/mod.ts';
import { GroupId, UserId } from '~/src/shared/mode/mod.ts';
import { SharedData } from '~/src/shared/shared-data/mod.ts';
import { Access, GUEST_GID, GUEST_UID } from '~/src/shared/access/mod.ts';

export class Session {
  private data: SharedData<Access>;

  private constructor(data: SharedData<Access>) {
    this.data = data;
  }

  static async create(sm: SM, sid?: string) {
    const exists = sid && (await SharedData.exists(sm, sid));

    if (exists) {
      const data = await SharedData.load<Access>(sm, sid);

      return new Session(data);
    }

    // TODO: Session should have timeout

    const access: Access = {
      sid: crypto.randomUUID(),
      uid: GUEST_UID,
      gids: [GUEST_GID],
    };

    const data = await SharedData.create<Access>(sm, access.sid!, access);

    return new Session(data);
  }

  get sid() {
    return this.data.id;
  }

  access() {
    return this.data.get();
  }

  async grantAdmin() {
    await this.data.set(true, 'admin');
  }

  async revokeAdmin() {
    await this.data.unset('admin');
  }

  async login(uid: UserId, gids: GroupId[]) {
    await this.revokeAdmin();
    await this.data.set(uid, 'uid');
    await this.data.set(gids, 'gids');
  }

  async logout() {
    await this.revokeAdmin();
    await this.data.set(GUEST_UID, 'uid');
    await this.data.set([GUEST_GID], 'gids');
  }
}
