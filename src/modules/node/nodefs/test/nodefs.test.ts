import { assert, assertArrayIncludes, assertEquals, assertNotEquals, assertRejects } from '@std/assert';
import { Collection } from '@db/mongo';
import { DB, DBConfig } from '~/src/external/db/mod.ts';
import { ADMIN_ACCESS, ADMIN_GID, ADMIN_UID, DEFAULT_UMASK } from '~/src/shared/access/constants.ts';
import { NodeData } from '../mod.ts';
import { copy } from '../methods/copy.ts';
import { ensureRoot } from '../methods/ensure-root.ts';
import { exists } from '../methods/exists.ts';
import { hardlink } from '../methods/hardlink.ts';
import { make } from '../methods/make.ts';
import { move } from '../methods/move.ts';
import { remove } from '../methods/remove.ts';
import { resolveOne } from '../methods/resolve-one.ts';
import { resolvePaths } from '../methods/resolve-paths.ts';
import { resolve } from '../methods/resolve.ts';
import { setAttrs } from '../methods/set-attrs.ts';
import { setProps } from '../methods/set-props.ts';
import { softlink } from '../methods/softlink.ts';

const dirWrap = (col: Collection<NodeData>, fn: (dir: string) => Promise<void>) => {
  return async () => {
    const name = `/${crypto.randomUUID()}`;
    await make(col, ADMIN_ACCESS, name, 'd');

    try {
      await fn(name);
    } finally {
      await remove(col, ADMIN_ACCESS, name);
    }
  };
};

Deno.test({
  name: 'nodefs',
  fn: async (t) => {
    const config: DBConfig = {
      db: crypto.randomUUID(),
      servers: [
        {
          host: 'localhost',
          port: 27017,
        },
      ],
    };

    // Bringup

    const db = await DB.create(config);
    const col = db.collection<NodeData>('nodes');

    // Test steps

    await t.step(`should create a root node`, async () => {
      const root = await ensureRoot(col);
      const root2 = await resolveOne(col, ADMIN_ACCESS, '/');

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

    await t.step(`should not allow to create a node with an invalid name`, async () => {
      const invalidNames = {
        'colon:': 'name is invalid',
        'question?': 'name is invalid',
        'and&': 'name is invalid',
        'comma,': 'name is invalid',
        'star*': 'name is invalid',
        'doublequote"': 'name is invalid',
        "singlequote'": 'name is invalid',
        '/': 'name is invalid',
        '.': 'name can not be a single dot',
        '..': 'name can not be a just two dots',
        '/./': 'name can not be a single dot',
        '/../': 'name can not be a just two dots',
      };

      for (const [invalidName, msg] of Object.entries(invalidNames)) {
        await assertRejects(
          async () => {
            await make(col, ADMIN_ACCESS, `/${invalidName}`, 'd');
          },
          Error,
          msg,
        );
      }
    });

    await t.step(
      `should create a node`,
      dirWrap(col, async (root) => {
        const dir = await make(col, ADMIN_ACCESS, `${root}/dir`, 'd', {
          hello: 'world',
        });
        const dir2 = await resolveOne(col, ADMIN_ACCESS, `${root}/dir`);

        assertEquals(dir._id, dir2._id);
        assertEquals(dir.type, 'd');
        assertEquals(dir.props.count, 1);
        assertEquals(dir.attrs, {
          hello: 'world',
        });
      }),
    );

    await t.step(
      `should create two nodes and remove them recursive`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/dir1`, 'd');
        await make(col, ADMIN_ACCESS, `${root}/dir1/dir2`, 'd');

        assert(await exists(col, ADMIN_ACCESS, `${root}/dir1`));
        assert(await exists(col, ADMIN_ACCESS, `${root}/dir1/dir2`));

        await remove(col, ADMIN_ACCESS, `${root}/dir1`);

        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/dir1/dir2`), false);
        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/dir1`), false);
      }),
    );

    await t.step(
      `should not remove node, just unlink if hard link exists`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/target`, 'f');
        await hardlink(col, ADMIN_ACCESS, `${root}/link`, `${root}/target`);

        const target = await resolveOne(col, ADMIN_ACCESS, `${root}/target`);
        const targetViaLink = await resolveOne(col, ADMIN_ACCESS, `${root}/link`);

        assertEquals(target._id, targetViaLink._id);
        assertEquals(target.props.count, 2);
        assertEquals(targetViaLink.props.count, 2);

        await remove(col, ADMIN_ACCESS, `${root}/target`);
        const targetViaLink2 = await resolveOne(col, ADMIN_ACCESS, `${root}/link`);

        assertEquals(target._id, targetViaLink2._id);
        assertEquals(targetViaLink2.props.count, 1);
      }),
    );

    await t.step(
      `should group three nodes and remove one`,
      dirWrap(col, async (root) => {
        const group = crypto.randomUUID();
        await make(col, ADMIN_ACCESS, `${root}/file1`, 'f', {}, { group });
        await make(col, ADMIN_ACCESS, `${root}/file2`, 'f', {}, { group });
        await make(col, ADMIN_ACCESS, `${root}/file3`, 'f', {}, { group });
        await make(col, ADMIN_ACCESS, `${root}/file4`, 'f');

        await remove(col, ADMIN_ACCESS, `${root}/file2`);

        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/file1`), false);
        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/file2`), false);
        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/file3`), false);
        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/file4`), true);
      }),
    );

    await t.step(
      `should create a soft link and resolve it`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/target`, 'f');
        await softlink(col, ADMIN_ACCESS, `${root}/link`, `${root}/target`, 's');

        const target = await resolveOne(col, ADMIN_ACCESS, `${root}/target`);
        const targetViaLink = await resolveOne(col, ADMIN_ACCESS, `${root}/link`);
        const link = await resolveOne(col, ADMIN_ACCESS, `${root}/link`, { readlink: true });

        assertEquals(target._id, targetViaLink._id);
        assertEquals(target.props.count, 1);
        assertNotEquals(target._id, link._id);
        assertEquals(link.props.count, 1);
        assertEquals(link.props.link, `${root}/target`);
      }),
    );

    await t.step(
      `should get all paths of a hardlink when they have the same parent`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/link1`, 'f');
        const hlink2 = await hardlink(col, ADMIN_ACCESS, `${root}/link2`, `${root}/link1`);

        const paths = await resolvePaths(col, ADMIN_ACCESS, hlink2._id);

        assertEquals(paths.length, 2);
        assertArrayIncludes(paths, [
          `${root}/link1`,
          `${root}/link2`,
        ]);
      }),
    );

    await t.step(
      `should get all paths of a hardlink when they have different parents`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/link`, 'f');
        await make(col, ADMIN_ACCESS, `${root}/dir`, 'f');
        const hlink2 = await hardlink(col, ADMIN_ACCESS, `${root}/dir/link`, `${root}/link`);

        const paths = await resolvePaths(col, ADMIN_ACCESS, hlink2._id);

        assertEquals(paths.length, 2);
        assertArrayIncludes(paths, [
          `${root}/dir/link`,
          `${root}/link`,
        ]);
      }),
    );

    await t.step(
      `should not allow two children with the same name`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/commonFile`, 'f');

        await assertRejects(
          async () => {
            await make(col, ADMIN_ACCESS, `${root}/commonFile`, 'f');
          },
          Error,
          'name already taken',
        );
      }),
    );

    await t.step(
      `should list children of node`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/dir`, 'd');
        const fa = await make(col, ADMIN_ACCESS, `${root}/dir/a`, 'f');
        const fb = await make(col, ADMIN_ACCESS, `${root}/dir/b`, 'f');
        const fo = await make(col, ADMIN_ACCESS, `${root}/dir/o`, 'f');
        const fc = await make(col, ADMIN_ACCESS, `${root}/dir/c`, 'f');
        const f2 = await make(col, ADMIN_ACCESS, `${root}/dir/2`, 'f');

        const children = await resolve(col, ADMIN_ACCESS, `${root}/dir/*`);

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
      `should list children of node with pattern`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/dir`, 'd');
        const h1 = await make(col, ADMIN_ACCESS, `${root}/dir/hello`, 'f');
        const h2 = await make(col, ADMIN_ACCESS, `${root}/dir/helloworld`, 'f');
        const h3 = await make(col, ADMIN_ACCESS, `${root}/dir/worldhello`, 'f');
        await make(col, ADMIN_ACCESS, `${root}/dir/world`, 'f');
        await make(col, ADMIN_ACCESS, `${root}/dir/other`, 'f');

        const children = await resolve(col, ADMIN_ACCESS, `${root}/dir/*hello*`);

        assertEquals(children.length, 3);
        assertArrayIncludes(children, [
          h1,
          h2,
          h3,
        ]);
      }),
    );

    await t.step(
      `should list children of node with pattern case sensitive`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/dir`, 'd');
        await make(col, ADMIN_ACCESS, `${root}/dir/Hello`, 'f');
        const h2 = await make(col, ADMIN_ACCESS, `${root}/dir/helloworld`, 'f');
        await make(col, ADMIN_ACCESS, `${root}/dir/worldHello`, 'f');
        await make(col, ADMIN_ACCESS, `${root}/dir/world`, 'f');
        await make(col, ADMIN_ACCESS, `${root}/dir/other`, 'f');

        const children = await resolve(col, ADMIN_ACCESS, `${root}/dir/*hello*`, {
          caseSensitive: true,
        });

        assertEquals(children.length, 1);
        assertArrayIncludes(children, [
          h2,
        ]);
      }),
    );

    await t.step(
      `should move a node`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/file`, 'f');
        await make(col, ADMIN_ACCESS, `${root}/dir`, 'd');

        await move(col, ADMIN_ACCESS, `${root}/file`, `${root}/dir`);

        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/file`), false);
        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/dir/file`), true);
      }),
    );

    await t.step(
      `should move a node and rename`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/file`, 'f');
        await make(col, ADMIN_ACCESS, `${root}/dir`, 'd');

        await move(col, ADMIN_ACCESS, `${root}/file`, `${root}/dir/file2`);

        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/file`), false);
        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/dir/file2`), true);
      }),
    );

    await t.step(
      `should reject a move into itself`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/dir`, 'd');

        await assertRejects(
          async () => {
            await move(col, ADMIN_ACCESS, `${root}/dir`, `${root}/dir`);
          },
          Error,
          'node can not be a child of itself',
        );
      }),
    );

    await t.step(
      `should move a node and update soft links`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/file`, 'f');
        await make(col, ADMIN_ACCESS, `${root}/dir`, 'd');
        await softlink(col, ADMIN_ACCESS, `${root}/link`, `${root}/file`, 's');

        await move(col, ADMIN_ACCESS, `${root}/file`, `${root}/dir/file2`);

        const link = await resolveOne(col, ADMIN_ACCESS, `${root}/link`, {
          readlink: true,
        });

        assertEquals(link.props.link, `${root}/dir/file2`);
      }),
    );

    await t.step(
      `should unset a property`,
      dirWrap(col, async (root) => {
        const file1 = await make(col, ADMIN_ACCESS, `${root}/file`, 'f', {}, { group: 'test' });

        assertEquals(file1.props.group, 'test');

        await setProps(col, ADMIN_ACCESS, file1._id, { group: null });
        const file2 = await resolveOne(col, ADMIN_ACCESS, `${root}/file`);

        assertEquals(file2.props.group, undefined);
      }),
    );

    await t.step(
      `should set and unset two attributes`,
      dirWrap(col, async (root) => {
        const file1 = await make(col, ADMIN_ACCESS, `${root}/file`, 'f', {
          hello: 'world',
          foo: 'bar',
        });

        assertEquals(file1.attrs.hello, 'world');
        assertEquals(file1.attrs.foo, 'bar');

        await setAttrs(col, ADMIN_ACCESS, file1._id, { hello: null, bar: 'foo' });
        const file2 = await resolveOne(col, ADMIN_ACCESS, `${root}/file`);

        assertEquals(file2.attrs.hello, undefined);
        assertEquals(file2.attrs.foo, 'bar');
        assertEquals(file2.attrs.bar, 'foo');
      }),
    );

    await t.step(
      `should copy tree of nodes`,
      dirWrap(col, async (root) => {
        await make(col, ADMIN_ACCESS, `${root}/dir1`, 'd');
        await make(col, ADMIN_ACCESS, `${root}/dir1/dir`, 'd');
        await make(col, ADMIN_ACCESS, `${root}/dir1/dir/file`, 'f');

        await copy(col, ADMIN_ACCESS, `${root}/dir1`, `${root}/dir2`);

        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/dir1`), true);
        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/dir1/dir`), true);
        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/dir1/dir/file`), true);
        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/dir2`), true);
        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/dir2/dir`), true);
        assertEquals(await exists(col, ADMIN_ACCESS, `${root}/dir2/dir/file`), true);
      }),
    );

    await t.step(
      `should honor the readlink resolve option`,
      dirWrap(col, async (root) => {
        const f1 = await make(col, ADMIN_ACCESS, `${root}/file1`, 'f');
        const f2 = await make(col, ADMIN_ACCESS, `${root}/file2`, 'f');
        await make(col, ADMIN_ACCESS, `${root}/dir1`, 'd');
        const f3 = await make(col, ADMIN_ACCESS, `${root}/dir1/file3`, 'f');

        const s1 = await softlink(col, ADMIN_ACCESS, `${root}/dir1/link1`, `${root}/file1`, 's');
        const s2 = await softlink(col, ADMIN_ACCESS, `${root}/dir1/link2`, `${root}/file2`, 's');

        const files = await resolve(col, ADMIN_ACCESS, `${root}/dir1/*`);

        assertEquals(files.length, 3);
        assertArrayIncludes([
          f1._id,
          f2._id,
          f3._id,
        ], files.map((f) => f._id));

        const links = await resolve(col, ADMIN_ACCESS, `${root}/dir1/*`, { readlink: true });

        assertArrayIncludes([
          s1._id,
          s2._id,
          f3._id,
        ], links.map((f) => f._id));
      }),
    );

    // Teardown

    await db.dropDatabase();
    await db.destroy();
  },
  sanitizeOps: false, // TODO: Investigate why this is needed
  sanitizeResources: false, // TODO: Investigate why this is needed
});
