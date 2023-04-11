export type UserId = number;
export type GroupId = number;
export type AccessMode = number;

export type Access = {
  sid?: string;
  admin?: boolean;
  uid: UserId;
  gids: GroupId[];
};

export type AccessLevel = 'r' | 'w' | 'x';
