"use strict";

/* global describe before after it afterEach */

const assert = require("assert");
const db = require("../../lib/db");

const { vfs, Node, auth } = require("../../vfs");

const destroyNodes = async (session) => {
    const root = await Node.resolve(session, "/");
    const children = await root.children(session, { nofollow: true });

    for (const child of children) {
        await root.removeChild(session, child);
        await child.remove(session);
    }
};

const assertThrows = async (fn, message) => {
    let threw = false;
    try {
        await fn();
    } catch (error) {
        threw = error;
    }

    assert(threw, message);
};

describe("Test", () => {
    describe("VFS", () => {
        before(async () => {
            await db.init({ mongoUrl: "mongodb://localhost:27017/murrix_test" });
            await db.dropDatabase();
            await vfs.init();
        });

        after(async () => {
            await db.dropDatabase();
            await db.stop();
        });

        describe("Types", () => {
            afterEach(async () => {
                await destroyNodes(auth.ADMIN_SESSION);
            });

            it("should create a directory node", async () => {
                const root = await Node.resolve(auth.ADMIN_SESSION, "/");
                const insertedNode = await root.createChild(auth.ADMIN_SESSION, "d", "folder1");
                const fetchedNode = await Node.resolve(auth.ADMIN_SESSION, "/folder1");

                assert.deepEqual(insertedNode, fetchedNode);

                assert.equal(fetchedNode.name, "folder1");
                assert.equal(fetchedNode.path, "/folder1");
                assert.equal(fetchedNode.properties.type, "d");
            });

            it("should resolve a symlink node", async () => {
                const root = await Node.resolve(auth.ADMIN_SESSION, "/");
                const folder = await root.createChild(auth.ADMIN_SESSION, "d", "folder");
                const symlink = await root.createChild(auth.ADMIN_SESSION, "s", "symlink", {
                    path: folder.path
                });

                const resolvedFolder = await Node.resolve(auth.ADMIN_SESSION, symlink.path);
                const resolvedSymlink = await Node.resolve(auth.ADMIN_SESSION, symlink.path, { readlink: true });

                delete resolvedFolder.extra;
                delete folder.extra;

                assert.deepEqual(resolvedFolder, folder);
                assert.deepEqual(resolvedSymlink, symlink);
            });

            it("should resolve a symlink node more than one level", async () => {
                const root = await Node.resolve(auth.ADMIN_SESSION, "/");
                const folder = await root.createChild(auth.ADMIN_SESSION, "d", "folder");
                const subfolder = await folder.createChild(auth.ADMIN_SESSION, "d", "subfolder");
                await root.createChild(auth.ADMIN_SESSION, "s", "symlink", {
                    path: folder.path
                });
                const subsymlink = await folder.createChild(auth.ADMIN_SESSION, "s", "symlink", {
                    path: subfolder.path
                });

                const resolvedSubfolder = await Node.resolve(auth.ADMIN_SESSION, "/symlink/symlink");
                const resolvedSymlink = await Node.resolve(auth.ADMIN_SESSION, "/symlink/symlink", { readlink: true });

                delete resolvedSymlink.path;
                delete subsymlink.path;
                delete resolvedSubfolder.extra;
                delete subfolder.extra;

                assert.deepEqual(resolvedSubfolder, subfolder);
                assert.deepEqual(resolvedSymlink, subsymlink);

                await assertThrows(() => Node.resolve(auth.ADMIN_SESSION, "/symlink/symlink", { nofollow: true }));
            });
        });
    });
});
