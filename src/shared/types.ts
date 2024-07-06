export type JSONValue =
  | null
  | string
  | number
  | boolean
  | undefined
  | { [x: string]: JSONValue }
  | JSONValue[];

export type JSONObject = { [x: string]: JSONValue };

export type NullPartial<T> = { [P in keyof T]?: T[P] | null };

export type EmptyObject = Record<string, never>;
