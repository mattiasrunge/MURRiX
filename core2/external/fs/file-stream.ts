import { createHash } from 'node:crypto'; // TODO: Can we use something else?

export default class FileStream {
  protected size = 0;
  protected checksum = '';
  protected stream: TransformStream;
  protected hasher = createHash('sha256');

  constructor() {
    // deno-lint-ignore no-this-alias
    const self = this;

    this.stream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        self.size += chunk.length;
        self.hasher.update(chunk);

        controller.enqueue(chunk);
      },
      flush(controller) {
        controller.terminate();
        self.checksum = self.hasher.digest('hex');
      },
    });
  }

  destroy() {
    // If we failed somewhere this leads to a reasource leak
    // https://github.com/denoland/deno/issues/18140
    if (this.checksum === '') {
      this.hasher.digest();
    }
  }

  getChecksum() {
    return this.checksum;
  }

  getSize() {
    return this.size;
  }

  getStream() {
    return this.stream;
  }
}
