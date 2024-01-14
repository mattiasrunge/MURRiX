import { MQ } from '~/external/mq/mod.ts';
import { SetPasswordReq, SetPasswordRes, UnsetPasswordReq, UnsetPasswordRes, VerifyPasswordReq, VerifyPasswordRes } from './internal-types.ts';
import { Vault } from './vault.ts';
import { PasswordId } from './types.ts';

const TIMEOUT = 1000 * 60 * 3; // 3 minutes

export class VaultClient extends Vault {
  protected mq: MQ;

  protected constructor(mq: MQ) {
    super();

    this.mq = mq;
  }

  static async create(mq: MQ) {
    return new VaultClient(mq);
  }

  async destroy() {}

  setPassword(password: string) {
    return this.mq.request<SetPasswordReq, SetPasswordRes>(
      'vault.setPassword',
      { password },
      TIMEOUT,
    );
  }

  unsetPassword(id: PasswordId) {
    return this.mq.request<UnsetPasswordReq, UnsetPasswordRes>(
      'vault.unsetPassword',
      { id },
      TIMEOUT,
    );
  }

  verifyPassword(id: PasswordId, password: string) {
    return this.mq.request<VerifyPasswordReq, VerifyPasswordRes>(
      'vault.verifyPassword',
      { id, password },
      TIMEOUT,
    );
  }
}
