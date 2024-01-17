export type JSONValue =
  | null
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | JSONValue[];

export type NullPartial<T> = { [P in keyof T]?: T[P] | null };
