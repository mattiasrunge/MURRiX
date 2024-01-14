import { assert, assertArrayIncludes, assertEquals, assertNotEquals, assertRejects } from 'std/testing/asserts.ts';
import { ADMIN_ACCESS, ADMIN_GID, ADMIN_UID, DEFAULT_UMASK, NodeFS, utils } from '~/lib/nodefs/mod.ts';
import { Service } from '~/lib/service/service.ts';
import { AppNodeFS } from '~/app/nodefs/app-nodefs.ts';
import { AppApi } from '~/app/api/app-api.ts';

const dirWrap = (nodefs: NodeFS, fn: (dir: string) => Promise<void>) => {
  return async () => {
    const name = `/${crypto.randomUUID()}`;
    await utils.make(nodefs, ADMIN_ACCESS, name, 'd');

    try {
      await fn(name);
    } finally {
      await utils.remove(nodefs, ADMIN_ACCESS, name);
    }
  };
};

Deno.test({
  name: 'nodefs',
  fn: async (t) => {
    const config = {
      fs: {
        areas: {
          'temp': await Deno.makeTempDir(),
        },
      },
      sm: {
        hostname: 'localhost',
        port: 6379,
      },
      db: {
        db: crypto.randomUUID(),
        servers: [
          {
            host: 'localhost',
            port: 27017,
          },
        ],
      },
      mq: {
        hostname: 'localhost',
        port: 5672,
      },
    };

    // Bringup

    const appNodeFS = await AppNodeFS.create(await Service.create('api.node.test.nodefs'), config);
    const appApi = await AppApi.create(await Service.create('api.node.test.api'), config);

    // Test steps

    const commonNodeFSTests = async (prefix: string, nodefs: NodeFS) => {
      await t.step(`[${prefix}]: should create a root node`, async () => {
        const root = await utils.ensureRoot(nodefs);
        const root2 = await nodefs.resolveOne(ADMIN_ACCESS, '/');

        assertEquals(root._id, root2._id);
        assertEquals(root.type, 'r');
        assert(root.props.btime.timestamp > 0);
        assertEquals(root.props.btime.uid, ADMIN_UID);
        assert(root.props.ptime.timestamp > 0);
        assertEquals(root.props.ptime.uid, ADMIN_UID);
        assert(root.props.atime.timestamp > 0);
        assertEquals(root.props.atime.uid, ADMIN_UID);
        assertEquals(root.props.mode, DEFAULT_UMASK);
        assertEquals(root.props.uid, ADMIN_UID);
        assertEquals(root.props.gid, ADMIN_GID);
        assertEquals(root.props.children, []);
        assertEquals(root.props.count, 0);
        assertEquals(root.props.files, []);
        assertEquals(root.props.link, undefined);
        assertEquals(root.attrs, {});
        assertEquals({
          name: '/',
          paths: ['/'],
          ...root,
        }, root2);
      });

      await t.step(`[${prefix}]: should not allow to create a node with an invalid name`, async () => {
        const invalidNames = {
          'colon:': 'child name is invalid',
          'question?': 'child name is invalid',
          'and&': 'child name is invalid',
          'comma,': 'child name is invalid',
          'star*': 'child name is invalid',
          'doublequote"': 'child name is invalid',
          'singlequote\'': 'child name is invalid',
          '/': 'child name is invalid',
          '.': 'child name can not be a single dot',
          '..': 'child name can not be a just two dots',
          '/./': 'child name can not be a single dot',
          '/../': 'child name can not be a just two dots',
        };

        for (const [invalidName, msg] of Object.entries(invalidNames)) {
          await assertRejects(
            async () => {
              await utils.make(nodefs, ADMIN_ACCESS, `/${invalidName}`, 'd');
            },
            Error,
            msg,
          );
        }
      });

      await t.step(
        `[${prefix}]: should create a node`,
        dirWrap(nodefs, async (root) => {
          const dir = await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir`, 'd', {
            hello: 'world',
          });
          const dir2 = await nodefs.resolveOne(ADMIN_ACCESS, `${root}/dir`);

          assertEquals(dir._id, dir2._id);
          assertEquals(dir.type, 'd');
          assertEquals(dir.props.count, 1);
          assertEquals(dir.attrs, {
            hello: 'world',
          });
        }),
      );

      await t.step(
        `[${prefix}]: should create two nodes and remove them recursive`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir1`, 'd');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir1/dir2`, 'd');

          assert(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/dir1`));
          assert(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/dir1/dir2`));

          await utils.remove(nodefs, ADMIN_ACCESS, `${root}/dir1`);

          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/dir1/dir2`), false);
          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/dir1`), false);
        }),
      );

      await t.step(
        `[${prefix}]: should not remove node, just unlink if hard link exists`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/target`, 'f');
          await utils.hardlink(nodefs, ADMIN_ACCESS, `${root}/link`, `${root}/target`);

          const target = await nodefs.resolveOne(ADMIN_ACCESS, `${root}/target`);
          const targetViaLink = await nodefs.resolveOne(ADMIN_ACCESS, `${root}/link`);

          assertEquals(target._id, targetViaLink._id);
          assertEquals(target.props.count, 2);
          assertEquals(targetViaLink.props.count, 2);

          await utils.remove(nodefs, ADMIN_ACCESS, `${root}/target`);
          const targetViaLink2 = await nodefs.resolveOne(ADMIN_ACCESS, `${root}/link`);

          assertEquals(target._id, targetViaLink2._id);
          assertEquals(targetViaLink2.props.count, 1);
        }),
      );

      await t.step(
        `[${prefix}]: should group three nodes and remove one`,
        dirWrap(nodefs, async (root) => {
          const group = crypto.randomUUID();
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/file1`, 'f', {}, { group });
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/file2`, 'f', {}, { group });
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/file3`, 'f', {}, { group });
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/file4`, 'f');

          await utils.remove(nodefs, ADMIN_ACCESS, `${root}/file2`);

          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/file1`), false);
          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/file2`), false);
          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/file3`), false);
          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/file4`), true);
        }),
      );

      await t.step(
        `[${prefix}]: should create a soft link and resolve it`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/target`, 'f');
          await utils.softlink(nodefs, ADMIN_ACCESS, `${root}/link`, `${root}/target`, 's');

          const target = await nodefs.resolveOne(ADMIN_ACCESS, `${root}/target`);
          const targetViaLink = await nodefs.resolveOne(ADMIN_ACCESS, `${root}/link`);
          const link = await nodefs.resolveOne(ADMIN_ACCESS, `${root}/link`, { readlink: true });

          assertEquals(target._id, targetViaLink._id);
          assertEquals(target.props.count, 1);
          assertNotEquals(target._id, link._id);
          assertEquals(link.props.count, 1);
          assertEquals(link.props.link, `${root}/target`);
        }),
      );

      await t.step(
        `[${prefix}]: should get all paths of a hardlink when they have the same parent`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/link1`, 'f');
          const hlink2 = await utils.hardlink(nodefs, ADMIN_ACCESS, `${root}/link2`, `${root}/link1`);

          const paths = await nodefs.resolvePaths(ADMIN_ACCESS, hlink2._id);

          assertEquals(paths.length, 2);
          assertArrayIncludes(paths, [
            `${root}/link1`,
            `${root}/link2`,
          ]);
        }),
      );

      await t.step(
        `[${prefix}]: should get all paths of a hardlink when they have different parents`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/link`, 'f');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir`, 'f');
          const hlink2 = await utils.hardlink(nodefs, ADMIN_ACCESS, `${root}/dir/link`, `${root}/link`);

          const paths = await nodefs.resolvePaths(ADMIN_ACCESS, hlink2._id);

          assertEquals(paths.length, 2);
          assertArrayIncludes(paths, [
            `${root}/dir/link`,
            `${root}/link`,
          ]);
        }),
      );

      await t.step(
        `[${prefix}]: should not allow two children with the same name`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/commonFile`, 'f');

          await assertRejects(
            async () => {
              await utils.make(nodefs, ADMIN_ACCESS, `${root}/commonFile`, 'f');
            },
            Error,
            'name already taken',
          );
        }),
      );

      await t.step(
        `[${prefix}]: should list children of node`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir`, 'd');
          const fa = await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/a`, 'f');
          const fb = await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/b`, 'f');
          const fo = await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/o`, 'f');
          const fc = await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/c`, 'f');
          const f2 = await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/2`, 'f');

          const children = await nodefs.resolve(ADMIN_ACCESS, `${root}/dir/*`);

          assertEquals(children.length, 5);
          assertArrayIncludes(children, [
            f2,
            fa,
            fb,
            fc,
            fo,
          ]);
        }),
      );

      await t.step(
        `[${prefix}]: should list children of node with pattern`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir`, 'd');
          const h1 = await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/hello`, 'f');
          const h2 = await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/helloworld`, 'f');
          const h3 = await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/worldhello`, 'f');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/world`, 'f');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/other`, 'f');

          const children = await nodefs.resolve(ADMIN_ACCESS, `${root}/dir/*hello*`);

          assertEquals(children.length, 3);
          assertArrayIncludes(children, [
            h1,
            h2,
            h3,
          ]);
        }),
      );

      await t.step(
        `[${prefix}]: should list children of node with pattern case sensitive`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir`, 'd');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/Hello`, 'f');
          const h2 = await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/helloworld`, 'f');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/worldHello`, 'f');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/world`, 'f');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir/other`, 'f');

          const children = await nodefs.resolve(ADMIN_ACCESS, `${root}/dir/*hello*`, {
            caseSensitive: true,
          });

          assertEquals(children.length, 1);
          assertArrayIncludes(children, [
            h2,
          ]);
        }),
      );

      await t.step(
        `[${prefix}]: should move a node`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/file`, 'f');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir`, 'd');

          await utils.move(nodefs, ADMIN_ACCESS, `${root}/file`, `${root}/dir`);

          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/file`), false);
          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/dir/file`), true);
        }),
      );

      await t.step(
        `[${prefix}]: should move a node and rename`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/file`, 'f');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir`, 'd');

          await utils.move(nodefs, ADMIN_ACCESS, `${root}/file`, `${root}/dir/file2`);

          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/file`), false);
          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/dir/file2`), true);
        }),
      );

      await t.step(
        `[${prefix}]: should reject a move into itself`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir`, 'd');

          await assertRejects(
            async () => {
              await utils.move(nodefs, ADMIN_ACCESS, `${root}/dir`, `${root}/dir`);
            },
            Error,
            'node can not be a child of itself',
          );
        }),
      );

      await t.step(
        `[${prefix}]: should move a node and update soft links`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/file`, 'f');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir`, 'd');
          await utils.softlink(nodefs, ADMIN_ACCESS, `${root}/link`, `${root}/file`, 's');

          await utils.move(nodefs, ADMIN_ACCESS, `${root}/file`, `${root}/dir/file2`);

          const link = await nodefs.resolveOne(ADMIN_ACCESS, `${root}/link`, {
            readlink: true,
          });

          assertEquals(link.props.link, `${root}/dir/file2`);
        }),
      );

      await t.step(
        `[${prefix}]: should unset a property`,
        dirWrap(nodefs, async (root) => {
          const file1 = await utils.make(nodefs, ADMIN_ACCESS, `${root}/file`, 'f', {}, { group: 'test' });

          assertEquals(file1.props.group, 'test');

          await nodefs.setProps(ADMIN_ACCESS, file1._id, { group: null });
          const file2 = await nodefs.resolveOne(ADMIN_ACCESS, `${root}/file`);

          assertEquals(file2.props.group, undefined);
        }),
      );

      await t.step(
        `[${prefix}]: should set and unset two attributes`,
        dirWrap(nodefs, async (root) => {
          const file1 = await utils.make(nodefs, ADMIN_ACCESS, `${root}/file`, 'f', {
            hello: 'world',
            foo: 'bar',
          });

          assertEquals(file1.attrs.hello, 'world');
          assertEquals(file1.attrs.foo, 'bar');

          await nodefs.setAttrs(ADMIN_ACCESS, file1._id, { hello: null, bar: 'foo' });
          const file2 = await nodefs.resolveOne(ADMIN_ACCESS, `${root}/file`);

          assertEquals(file2.attrs.hello, undefined);
          assertEquals(file2.attrs.foo, 'bar');
          assertEquals(file2.attrs.bar, 'foo');
        }),
      );

      await t.step(
        `[${prefix}]: should copy tree of nodes`,
        dirWrap(nodefs, async (root) => {
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir1`, 'd');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir1/dir`, 'd');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir1/dir/file`, 'f');

          await utils.copy(nodefs, ADMIN_ACCESS, `${root}/dir1`, `${root}/dir2`);

          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/dir1`), true);
          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/dir1/dir`), true);
          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/dir1/dir/file`), true);
          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/dir2`), true);
          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/dir2/dir`), true);
          assertEquals(await utils.exists(nodefs, ADMIN_ACCESS, `${root}/dir2/dir/file`), true);
        }),
      );

      await t.step(
        `[${prefix}]: should honor the readlink resolve option`,
        dirWrap(nodefs, async (root) => {
          const f1 = await utils.make(nodefs, ADMIN_ACCESS, `${root}/file1`, 'f');
          const f2 = await utils.make(nodefs, ADMIN_ACCESS, `${root}/file2`, 'f');
          await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir1`, 'd');
          const f3 = await utils.make(nodefs, ADMIN_ACCESS, `${root}/dir1/file3`, 'f');

          const s1 = await utils.softlink(nodefs, ADMIN_ACCESS, `${root}/dir1/link1`, `${root}/file1`, 's');
          const s2 = await utils.softlink(nodefs, ADMIN_ACCESS, `${root}/dir1/link2`, `${root}/file2`, 's');

          const files = await nodefs.resolve(ADMIN_ACCESS, `${root}/dir1/*`);

          assertEquals(files.length, 3);
          assertArrayIncludes([
            f1._id,
            f2._id,
            f3._id,
          ], files.map((f) => f._id));

          const links = await nodefs.resolve(ADMIN_ACCESS, `${root}/dir1/*`, { readlink: true });

          assertArrayIncludes([
            s1._id,
            s2._id,
            f3._id,
          ], links.map((f) => f._id));
        }),
      );

      await appNodeFS.db.dropDatabase();
    };

    await commonNodeFSTests('local', appNodeFS.nodefs);
    await commonNodeFSTests('remote', appApi.nodefs);

    // Teardown

    for (const root of Object.values(config.fs.areas)) {
      await Deno.remove(root, { recursive: true });
    }

    await appApi.stop();
    await appNodeFS.stop();
  },
  sanitizeOps: false, // TODO: Investigate why this is needed
  sanitizeResources: false, // TODO: Investigate why this is needed
});
