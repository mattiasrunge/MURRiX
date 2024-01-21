export type JSONValue =
  | null
  | string
  | number
  | boolean
  | undefined
  | { [x: string]: JSONValue }
  | JSONValue[];

export type NullPartial<T> = { [P in keyof T]?: T[P] | null };
