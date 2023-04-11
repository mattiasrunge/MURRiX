import { Physical, SharedData } from '~/layers/1_physical/mod.ts';
import { Access, GroupId, GUEST_GID, GUEST_UID, UserId } from '~/layers/2_nodefs/mod.ts';

export class Session {
  private data: SharedData<Access>;

  private constructor(data: SharedData<Access>) {
    this.data = data;
  }

  static async create(phy: Physical, sid?: string) {
    const exists = sid && (await SharedData.exists(phy, sid));

    // TODO: Set some expire time for this, which we reset on load.

    if (exists) {
      const data = await SharedData.load<Access>(phy, sid);

      return new Session(data);
    }

    const access: Access = {
      sid: crypto.randomUUID(),
      uid: GUEST_UID,
      gids: [GUEST_GID],
    };

    const data = await SharedData.create<Access>(phy, access.sid!, access);

    return new Session(data);
  }

  get sid() {
    return this.data.id;
  }

  access() {
    return this.data.get<Access>();
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
