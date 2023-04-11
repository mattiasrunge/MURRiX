import { assert, assertEquals, assertRejects } from 'std/testing/asserts.ts';
import { FS } from '../mod.ts';

const checksums: Record<string, string> = {
  'test.txt': '7ee49ae786b341c1fe9bed7bca714319df26ece112aa024d9e3c76617f14fad1',
};

const openTestFile = async (name: string) => {
  const url = new URL(`./data/${name}`, import.meta.url);

  return {
    checksum: checksums[name],
    file: await Deno.open(url),
  };
};

const readTestFile = async (name: string) => {
  const url = new URL(`./data/${name}`, import.meta.url);

  return {
    checksum: checksums[name],
    content: await Deno.readTextFile(url),
  };
};

Deno.test('fs', async (t) => {
  const config = {
    areas: {
      area1: await Deno.makeTempDir(),
    },
  };

  const fs = await FS.connect('abc', config);

  await t.step('should write a simple file', async () => {
    const testFile = await openTestFile('test.txt');
    const info = await fs.write({ area: 'area1', name: 'test' }, testFile.file.readable);

    assertEquals(info.checksum, testFile.checksum);
    assertEquals(info.name, 'test');
    assertEquals(info.area, 'area1');
  });

  await t.step('should read file info', async () => {
    const info = await fs.info({ area: 'area1', name: 'test' });

    assertEquals(info.checksum, checksums['test.txt']);
    assertEquals(info.name, 'test');
    assertEquals(info.area, 'area1');
  });

  await t.step('should read a simple file', async () => {
    const testFile = await readTestFile('test.txt');
    const file = await fs.read({ area: 'area1', name: 'test' });

    const buf = new Uint8Array(100);
    const num = await file.read(buf);
    const content = (new TextDecoder().decode(buf)).slice(0, num as number);

    file.close();

    assertEquals(content, testFile.content);
  });

  await t.step('should regenerate file info', async () => {
    const info = await fs.regenerateInfo({ area: 'area1', name: 'test' });

    assertEquals(info.checksum, checksums['test.txt']);
    assertEquals(info.name, 'test');
    assertEquals(info.area, 'area1');
  });

  await t.step('should verify file', async () => {
    const ok = await fs.verify({ area: 'area1', name: 'test' });

    assert(ok);
  });

  await t.step('should fail overwrite existing file', async () => {
    const testFile = await openTestFile('test.txt');

    try {
      assertRejects(async () => {
        await fs.write({ area: 'area1', name: 'test' }, testFile.file.readable);
      }, Deno.errors.AlreadyExists);
    } finally {
      testFile.file.close();
    }
  });

  for (const root of Object.values(config.areas)) {
    await Deno.remove(root, { recursive: true });
  }

  await fs.close();
});
