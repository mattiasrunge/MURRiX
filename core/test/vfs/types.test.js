"use strict";

/* global describe beforeAll afterAll it afterEach */

const assert = require("assert");
const db = require("../../lib/core/db");
const core = require("../../lib/core");
const Node = require("../../lib/core/Node");
const { ADMIN_CLIENT } = require("../../lib/core/auth");

require("../../lib/packages/vfs");
require("../../lib/packages/geolocation");
require("../../lib/packages/statistics");
require("../../lib/packages/media");
require("../../lib/packages/murrix");

const destroyNodes = async (client) => {
    const root = await Node.resolve(client, "/");
    const children = await root.children(client, { nofollow: true });

    for (const child of children) {
        await root.removeChild(client, child);
        await child.remove(client);
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
        beforeAll(async () => {
            await db.init({ mongoUrl: "mongodb://localhost:27017/murrix_test_types" });
            await db.dropDatabase();
            await core.init();
        }, 15000);

        afterAll(async () => {
            await db.dropDatabase();
            await db.stop();
        });

        describe("Types", () => {
            afterEach(async () => {
                await destroyNodes(ADMIN_CLIENT);
            });

            it("should create a directory node", async () => {
                const root = await Node.resolve(ADMIN_CLIENT, "/");
                const insertedNode = await root.createChild(ADMIN_CLIENT, "d", "folder1");
                const fetchedNode = await Node.resolve(ADMIN_CLIENT, "/folder1");
                assert.deepStrictEqual(insertedNode, fetchedNode);

                assert.strictEqual(fetchedNode.name, "folder1");
                assert.strictEqual(fetchedNode.path, "/folder1");
                assert.strictEqual(fetchedNode.properties.type, "d");
            });

            it("should resolve a symlink node", async () => {
                const root = await Node.resolve(ADMIN_CLIENT, "/");
                const folder = await root.createChild(ADMIN_CLIENT, "d", "folder");
                const symlink = await root.createChild(ADMIN_CLIENT, "s", "symlink", {
                    path: folder.path
                });

                const resolvedFolder = await Node.resolve(ADMIN_CLIENT, symlink.path);
                const resolvedSymlink = await Node.resolve(ADMIN_CLIENT, symlink.path, { readlink: true });

                delete resolvedFolder.extra;
                delete folder.extra;

                assert.deepStrictEqual(resolvedFolder, folder);
                assert.deepStrictEqual(resolvedSymlink, symlink);
            });

            it("should resolve a symlink node more than one level", async () => {
                const root = await Node.resolve(ADMIN_CLIENT, "/");
                const folder = await root.createChild(ADMIN_CLIENT, "d", "folder");
                const subfolder = await folder.createChild(ADMIN_CLIENT, "d", "subfolder");
                await root.createChild(ADMIN_CLIENT, "s", "symlink", {
                    path: folder.path
                });
                const subsymlink = await folder.createChild(ADMIN_CLIENT, "s", "symlink", {
                    path: subfolder.path
                });

                const resolvedSubfolder = await Node.resolve(ADMIN_CLIENT, "/symlink/symlink");
                const resolvedSymlink = await Node.resolve(ADMIN_CLIENT, "/symlink/symlink", { readlink: true });

                delete resolvedSymlink.path;
                delete subsymlink.path;
                delete resolvedSubfolder.extra;
                delete subfolder.extra;

                assert.deepStrictEqual(resolvedSubfolder, subfolder);
                assert.deepStrictEqual(resolvedSymlink, subsymlink);

                await assertThrows(() => Node.resolve(ADMIN_CLIENT, "/symlink/symlink", { nofollow: true }));
            });
        });
    });
});
