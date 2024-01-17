export type UserId = number;
export type GroupId = number;
export type Mode = number;

export type ModeMask = {
  READ: number;
  WRITE: number;
  EXEC: number;
};

export type ModeStringOptions = {
  acl?: boolean;
  owner?: boolean;
  group?: boolean;
  other?: boolean;
};
