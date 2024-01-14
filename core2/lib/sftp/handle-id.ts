const ids: number[] = [];

export class HandleId {
  private id: number;
  private encodedId: Buffer;

  constructor() {
    this.id = this.generateId();
    this.encodedId = Buffer.alloc(4);
    this.encodedId.writeUInt32BE(this.id, 0);
  }

  get encoded() {
    return this.encodedId;
  }

  get unencoded() {
    return this.id;
  }

  private generateId() {
    let id = 1;

    while (ids.includes(id)) {
      id++;
    }

    ids.push(id);

    return id;
  }

  static decodeId(encoded: Buffer) {
    return encoded.readUInt32BE(0);
  }

  release() {
    const index = ids.indexOf(this.id);
    (index !== -1) && ids.splice(index, 1);
  }
}
