import { Access } from './types.ts';

export const ADMIN_USERNAME = 'admin';
export const ADMIN_GROUPNAME = 'admin';
export const ADMIN_UID = 1000;
export const ADMIN_GID = 1000;

export const GUEST_USERNAME = 'guest';
export const GUEST_GROUPNAME = 'guest';
export const GUEST_UID = 1001;
export const GUEST_GID = 1001;

export const USERS_GROUPNAME = 'users';
export const USERS_GID = 1002;

export const CUSTODIANS_GROUPNAME = 'custodians';
export const CUSTODIANS_GID = 1003;

export const DEFAULT_UMASK = 0o775;

export const ADMIN_ACCESS: Access = {
  admin: true,
  uid: ADMIN_UID,
  gids: [ADMIN_GID],
};
