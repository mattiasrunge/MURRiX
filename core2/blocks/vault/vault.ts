import { PasswordId } from './types.ts';

export abstract class Vault {
  /**
   * @description Set a password
   */
  public abstract setPassword(password: string): Promise<PasswordId>;

  /**
   * @description Remove a password
   */
  public abstract unsetPassword(id: PasswordId): Promise<boolean>;

  /**
   * @description Check password
   */
  public abstract verifyPassword(id: PasswordId, password: string): Promise<boolean>;
}
