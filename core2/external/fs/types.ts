export type FSAreas = Record<string, string>;

export type FSConfig = {
  areas: FSAreas;
};

export type FSPath = {
  area: string;
  name: string;
};

export type FSInfo = FSPath & {
  size: number;
  checksum: string | undefined;
};
