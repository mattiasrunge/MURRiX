import { MQ } from '~/external/mq/mod.ts';
import { VaultDB } from './vault-db.ts';
import { SetPasswordReq, SetPasswordRes, UnsetPasswordReq, UnsetPasswordRes, VerifyPasswordReq, VerifyPasswordRes } from './internal-types.ts';

export const exposeVault = async (nodefs: VaultDB, mq: MQ) => {
  await mq.requestHandler<SetPasswordReq, SetPasswordRes>(
    'vault.setPassword',
    ({ password }) => nodefs.setPassword(password),
  );

  await mq.requestHandler<UnsetPasswordReq, UnsetPasswordRes>(
    'vault.unsetPassword',
    ({ id }) => nodefs.unsetPassword(id),
  );

  await mq.requestHandler<VerifyPasswordReq, VerifyPasswordRes>(
    'vault.verifyPassword',
    ({ id, password }) => nodefs.verifyPassword(id, password),
  );
};
