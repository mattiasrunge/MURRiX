import { assert, assertEquals, assertExists, assertStringIncludes } from 'std/assert/mod.ts';
import { basename, join } from 'std/path/mod.ts';
import { bootstrap } from '~/src/lib/bootstrap.ts';
import { commit, fileGet, fileInfo, fileRemove, fileVerify, uploadCancel, uploadCreate, uploadData, uploadFile, uploadInfo } from '~/src/client/mod.ts';

const PORT = 15348;
const BASE_URL = `http://localhost:${PORT}`;
const DATA_DIR = new URL('./data', import.meta.url).pathname;

Deno.test('file', async (t) => {
  const rootDir = await Deno.makeTempDir();
  const filesDir = join(rootDir, 'files');
  const stagingDir = join(rootDir, 'staging');
  const removedDir = join(rootDir, 'removed');

  await Deno.mkdir(filesDir, { recursive: true });
  await Deno.mkdir(stagingDir, { recursive: true });
  await Deno.mkdir(removedDir, { recursive: true });

  const token1 = 'secret_token';
  const token2 = 'another_token';

  const { stop, forceStagingCleanup } = await bootstrap({
    port: PORT,
    baseUrl: BASE_URL,
    filesDir,
    stagingDir,
    removedDir,
    stagingExpireMs: 500, // 1ms very short,
    authorizedTokens: [
      token1,
      token2,
    ],
  });

  await t.step('invalid authorization token', async () => {
    const res = await fetch(BASE_URL, {
      headers: {
        'Authorization': 'Bearer invalid',
      },
    });
    await res.body?.cancel();

    assertEquals(res.status, 403);
  });

  await t.step('invalid authorization header', async () => {
    const res = await fetch(BASE_URL, {
      headers: {
        'Authorization': 'invalid',
      },
    });
    await res.body?.cancel();

    assertEquals(res.status, 403);
  });

  await t.step('missing authorization token', async () => {
    const res = await fetch(BASE_URL);
    await res.body?.cancel();

    assertEquals(res.status, 403);
  });

  await t.step('upload file', async () => {
    const filename = join(DATA_DIR, 'video.mp4');

    const postRes = await uploadCreate(token1, BASE_URL, filename);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);
    assertExists(target);
    assertStringIncludes(target, `${BASE_URL}/staging/`);

    const patchRes = await uploadFile(token1, target!, filename);
    const uploadOffset = patchRes.headers.get('upload-offset');
    const stat = await Deno.stat(filename);
    assertEquals(patchRes.status, 204);
    assertExists(uploadOffset);
    assertEquals(uploadOffset, `${stat.size}`);
  });

  await t.step('expire upload', async () => {
    const filename = join(DATA_DIR, 'animated.gif');

    const postRes = await uploadCreate(token1, BASE_URL, filename);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);
    assertExists(target);

    const infoRes1 = await uploadInfo(token1, target!);
    const uploadOffset1 = infoRes1.headers.get('upload-offset');
    assertEquals(infoRes1.status, 200);
    assertExists(uploadOffset1);
    assertEquals(uploadOffset1, `0`);

    await new Promise((r) => setTimeout(r, 1000)); // Sleep 1s

    await forceStagingCleanup();

    const infoRes2 = await uploadInfo(token1, target!);
    assertEquals(infoRes2.status, 404);
  });

  await t.step('cancel upload', async () => {
    const filename = join(DATA_DIR, 'audio.mp3');

    const postRes = await uploadCreate(token1, BASE_URL, filename);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);

    const patchRes = await uploadFile(token1, target!, filename);
    assertEquals(patchRes.status, 204);

    const cancelRes = await uploadCancel(token1, target!);
    assertEquals(cancelRes.status, 204);
  });

  await t.step('check upload', async () => {
    const filename = join(DATA_DIR, 'animated.gif');

    const postRes = await uploadCreate(token1, BASE_URL, filename);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);
    assertExists(target);

    const infoRes1 = await uploadInfo(token1, target!);
    const uploadOffset1 = infoRes1.headers.get('upload-offset');
    assertEquals(infoRes1.status, 200);
    assertExists(uploadOffset1);
    assertEquals(uploadOffset1, `0`);

    const patchRes = await uploadFile(token1, target!, filename);
    const uploadOffset = patchRes.headers.get('upload-offset');
    const stat = await Deno.stat(filename);
    assertEquals(patchRes.status, 204);
    assertExists(uploadOffset);
    assertEquals(uploadOffset, `${stat.size}`);

    const infoRes2 = await uploadInfo(token1, target!);
    const uploadOffset2 = infoRes2.headers.get('upload-offset');
    assertEquals(infoRes2.status, 200);
    assertExists(uploadOffset2);
    assertEquals(uploadOffset2, `${stat.size}`);
  });

  await t.step('upload file in chunks', async () => {
    const filename = '/dummy/hello_world.txt';
    const chunk1 = 'Hello';
    const chunk2 = 'World';
    const data = chunk1 + chunk2;

    const postRes = await uploadCreate(token1, BASE_URL, filename, data.length);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);
    assertExists(target);

    const patchRes1 = await uploadData(token1, target!, chunk1);
    const uploadOffset1 = patchRes1.headers.get('upload-offset');
    assertEquals(patchRes1.status, 204);
    assertExists(uploadOffset1);
    assertEquals(uploadOffset1, `${chunk1.length}`);

    const patchRes2 = await uploadData(token1, target!, chunk2, chunk1.length);
    const uploadOffset2 = patchRes2.headers.get('upload-offset');
    assertEquals(patchRes2.status, 204);
    assertExists(uploadOffset2);
    assertEquals(uploadOffset2, `${data.length}`);
  });

  await t.step('commit uploaded file', async () => {
    const filename = join(DATA_DIR, 'image.jpg');
    const ownerId = crypto.randomUUID();

    const postRes = await uploadCreate(token1, BASE_URL, filename);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);

    const patchRes = await uploadFile(token1, target!, filename);
    assertEquals(patchRes.status, 204);

    const stagedId = basename(target!);
    const commitRes = await commit(token1, BASE_URL, stagedId, ownerId);
    assertEquals(commitRes.status, 200);
    const metadata = await commitRes.json();
    assertEquals(metadata.ownerId, ownerId);
    assertEquals(metadata.filename, basename(filename));
    assertEquals(metadata.crc32, 'a3bbe77e');
    assertEquals(metadata.size, 9090);
    assertEquals(metadata.type, 'image/jpeg');
    assertExists(metadata.id);
    assertExists(metadata.commitedAt);
  });

  await t.step('commit uploaded file without owner id', async () => {
    const ownerId = crypto.randomUUID();

    const commitRes = await commit(token1, BASE_URL, 'invalid', ownerId);
    await commitRes.body?.cancel();
    assertEquals(commitRes.status, 404);
  });

  await t.step('commit uploaded file which do not exist', async () => {
    const filename = join(DATA_DIR, 'image.jpg');
    const ownerId = '';

    const postRes = await uploadCreate(token1, BASE_URL, filename);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);

    const patchRes = await uploadFile(token1, target!, filename);
    assertEquals(patchRes.status, 204);

    const stagedId = basename(target!);
    const commitRes = await commit(token1, BASE_URL, stagedId, ownerId);
    await commitRes.body?.cancel();
    assertEquals(commitRes.status, 400);
  });

  await t.step('commit uploaded file with corrupt metadata', async () => {
    const filename = join(DATA_DIR, 'image.jpg');
    const ownerId = crypto.randomUUID();

    const postRes = await uploadCreate(token1, BASE_URL, filename);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);

    const patchRes = await uploadFile(token1, target!, filename);
    assertEquals(patchRes.status, 204);

    const stagedId = basename(target!);

    // Sabotage file
    await Deno.writeTextFile(join(stagingDir, `${stagedId}.json`), 'This is not JSON');

    const commitRes = await commit(token1, BASE_URL, stagedId, ownerId);
    await commitRes.body?.cancel();
    assertEquals(commitRes.status, 500);
  });

  await t.step('commit uploaded file with invalid metadata', async () => {
    const filename = join(DATA_DIR, 'image.jpg');
    const ownerId = crypto.randomUUID();

    const postRes = await uploadCreate(token1, BASE_URL, filename);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);

    const patchRes = await uploadFile(token1, target!, filename);
    assertEquals(patchRes.status, 204);

    const stagedId = basename(target!);

    // Sabotage file
    await Deno.writeTextFile(join(stagingDir, `${stagedId}.json`), '{}');

    const commitRes = await commit(token1, BASE_URL, stagedId, ownerId);
    await commitRes.body?.cancel();
    assertEquals(commitRes.status, 500);
  });

  await t.step('remove file', async () => {
    const filename = join(DATA_DIR, 'raw.cr2');
    const ownerId = crypto.randomUUID();

    const postRes = await uploadCreate(token1, BASE_URL, filename);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);

    const patchRes = await uploadFile(token1, target!, filename);
    assertEquals(patchRes.status, 204);

    const stagedId = basename(target!);
    const commitRes = await commit(token1, BASE_URL, stagedId, ownerId);
    assertEquals(commitRes.status, 200);
    const metadata = await commitRes.json();
    assertExists(metadata.id);

    const removeRes = await fileRemove(token1, BASE_URL, metadata.id);
    assertEquals(removeRes.status, 200);

    const infoRes = await fileInfo(token1, BASE_URL, metadata.id);
    await infoRes.body?.cancel();
    assertEquals(infoRes.status, 404);

    await Deno.stat(join(removedDir, metadata.id));
    await Deno.stat(join(removedDir, `${metadata.id}.json`));
  });

  await t.step('check file info', async () => {
    const filename = join(DATA_DIR, 'raw.cr2');
    const ownerId = crypto.randomUUID();

    const postRes = await uploadCreate(token1, BASE_URL, filename);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);

    const patchRes = await uploadFile(token1, target!, filename);
    assertEquals(patchRes.status, 204);

    const stagedId = basename(target!);
    const commitRes = await commit(token1, BASE_URL, stagedId, ownerId);
    assertEquals(commitRes.status, 200);
    const metadata1 = await commitRes.json();
    assertExists(metadata1.id);

    const infoRes = await fileInfo(token1, BASE_URL, metadata1.id);
    assertEquals(infoRes.status, 200);
    const metadata2 = await infoRes.json();

    assertEquals(metadata1, metadata2);
  });

  await t.step('check file with corrupt info', async () => {
    const filename = join(DATA_DIR, 'raw.cr2');
    const ownerId = crypto.randomUUID();

    const postRes = await uploadCreate(token1, BASE_URL, filename);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);

    const patchRes = await uploadFile(token1, target!, filename);
    assertEquals(patchRes.status, 204);

    const stagedId = basename(target!);
    const commitRes = await commit(token1, BASE_URL, stagedId, ownerId);
    assertEquals(commitRes.status, 200);
    const metadata = await commitRes.json();
    assertExists(metadata.id);
    assertEquals(metadata.type, 'image/x-canon-cr2');

    // Sabotage file
    await Deno.writeTextFile(join(filesDir, `${metadata.id.replaceAll('-', '/')}.json`), 'This is not JSON');

    const infoRes = await fileInfo(token1, BASE_URL, metadata.id);
    await infoRes.body?.cancel();
    assertEquals(infoRes.status, 500);
  });

  await t.step('verify file', async () => {
    const filename = join(DATA_DIR, 'document.odt');
    const ownerId = crypto.randomUUID();

    const postRes = await uploadCreate(token1, BASE_URL, filename);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);

    const patchRes = await uploadFile(token1, target!, filename);
    assertEquals(patchRes.status, 204);

    const stagedId = basename(target!);
    const commitRes = await commit(token1, BASE_URL, stagedId, ownerId);
    assertEquals(commitRes.status, 200);
    const metadata = await commitRes.json();
    assertExists(metadata.id);

    const verifyRes = await fileVerify(token1, BASE_URL, metadata.id);
    assertEquals(verifyRes.status, 200);
    const verifyData = await verifyRes.json();

    assert(verifyData.ok);
    assertEquals(verifyData.type, 'crc32');
    assertEquals(verifyData.current, '6d23422c');
    assertEquals(verifyData.current, verifyData.stored);
  });

  await t.step('verify file with corrupt data', async () => {
    const filename = '/dummy/hello_world.txt';
    const data = 'Hello World';
    const ownerId = crypto.randomUUID();

    const postRes = await uploadCreate(token1, BASE_URL, filename, data.length);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);
    assertExists(target);

    const patchRes = await uploadData(token1, target!, data);
    assertEquals(patchRes.status, 204);

    const stagedId = basename(target!);
    const commitRes = await commit(token1, BASE_URL, stagedId, ownerId);
    assertEquals(commitRes.status, 200);
    const metadata = await commitRes.json();
    assertExists(metadata.id);

    // Sabotage file
    await Deno.writeTextFile(join(filesDir, metadata.id.replaceAll('-', '/')), 'Corruption everywhere');

    const verifyRes = await fileVerify(token1, BASE_URL, metadata.id);
    assertEquals(verifyRes.status, 200);
    const verifyData = await verifyRes.json();

    assertEquals(verifyData.ok, false);
    assertEquals(verifyData.type, 'crc32');
    assertEquals(verifyData.stored, '4a17b156');
    assertEquals(verifyData.current, '720691a7');
  });

  await t.step('verify file with corrupt metadata', async () => {
    const filename = '/dummy/hello_world.txt';
    const data = 'Hello World';
    const ownerId = crypto.randomUUID();

    const postRes = await uploadCreate(token1, BASE_URL, filename, data.length);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);
    assertExists(target);

    const patchRes = await uploadData(token1, target!, data);
    assertEquals(patchRes.status, 204);

    const stagedId = basename(target!);
    const commitRes = await commit(token1, BASE_URL, stagedId, ownerId);
    assertEquals(commitRes.status, 200);
    const metadata = await commitRes.json();
    assertExists(metadata.id);

    // Sabotage file
    await Deno.writeTextFile(join(filesDir, `${metadata.id.replaceAll('-', '/')}.json`), 'This is not JSON');

    const verifyRes = await fileVerify(token1, BASE_URL, metadata.id);
    await verifyRes.body?.cancel();
    assertEquals(verifyRes.status, 500);
  });

  await t.step('download file', async () => {
    const filename = '/dummy/hello_world.txt';
    const data = 'Hello World';
    const ownerId = crypto.randomUUID();

    const postRes = await uploadCreate(token1, BASE_URL, filename, data.length);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);
    assertExists(target);

    const patchRes = await uploadData(token1, target!, data);
    assertEquals(patchRes.status, 204);

    const stagedId = basename(target!);
    const commitRes = await commit(token1, BASE_URL, stagedId, ownerId);
    assertEquals(commitRes.status, 200);
    const metadata = await commitRes.json();
    assertExists(metadata.id);

    const getRes = await fileGet(token1, BASE_URL, metadata.id);
    assertEquals(getRes.status, 200);
    const downloadData = await getRes.text();

    assertEquals(downloadData, data);
    assertEquals(getRes.headers.get('content-disposition'), `filename=${encodeURIComponent(basename(filename))}`);
    assertEquals(getRes.headers.get('checksum'), 'crc32=4a17b156');
    assertEquals(getRes.headers.get('content-length'), `${data.length}`);
    assertEquals(getRes.headers.get('content-type'), 'text/plain');
  });

  await t.step('download file with corrupt metadata', async () => {
    const filename = '/dummy/hello_world.txt';
    const data = 'Hello World';
    const ownerId = crypto.randomUUID();

    const postRes = await uploadCreate(token1, BASE_URL, filename, data.length);
    const target = postRes.headers.get('location');
    assertEquals(postRes.status, 201);
    assertExists(target);

    const patchRes = await uploadData(token1, target!, data);
    assertEquals(patchRes.status, 204);

    const stagedId = basename(target!);
    const commitRes = await commit(token1, BASE_URL, stagedId, ownerId);
    assertEquals(commitRes.status, 200);
    const metadata = await commitRes.json();
    assertExists(metadata.id);

    // Sabotage file
    await Deno.writeTextFile(join(filesDir, `${metadata.id.replaceAll('-', '/')}.json`), 'This is not JSON');

    const getRes = await fileGet(token1, BASE_URL, metadata.id);
    await getRes.body?.cancel();
    assertEquals(getRes.status, 500);
  });

  await stop();
  await Deno.remove(rootDir, { recursive: true });
});
