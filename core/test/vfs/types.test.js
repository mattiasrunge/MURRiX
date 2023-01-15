"use strict";

/* global describe beforeAll afterAll it afterEach */

const assert = require("assert");
const db = require("../../lib/db");
const packages = require("../../lib/packages");
const commander = require("../../lib/commander");
const Node = require("../../lib/lib/Node");
const { getAdminClient } = require("../../lib/auth");
const configuration = require("../../lib/config");

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
            configuration.mongoUrl = "mongodb://localhost:27017/murrix_test_types";
            await db.init();
            await db.dropDatabase();
            await commander.init();
            await packages.init();
        }, 15000);

        afterAll(async () => {
            await db.dropDatabase();
            await db.stop();
        });

        describe("Types", () => {
            afterEach(async () => {
                await destroyNodes(await getAdminClient());
            });

            it("should create a directory node", async () => {
                const root = await Node.resolve(await getAdminClient(), "/");
                const insertedNode = await root.createChild(await getAdminClient(), "d", "folder1");
                const fetchedNode = await Node.resolve(await getAdminClient(), "/folder1");
                assert.deepStrictEqual(insertedNode, fetchedNode);

                assert.strictEqual(fetchedNode.name, "folder1");
                assert.strictEqual(fetchedNode.path, "/folder1");
                assert.strictEqual(fetchedNode.properties.type, "d");
            });

            it("should resolve a symlink node", async () => {
                const root = await Node.resolve(await getAdminClient(), "/");
                const folder = await root.createChild(await getAdminClient(), "d", "folder");
                const symlink = await root.createChild(await getAdminClient(), "s", "symlink", {
                    path: folder.path
                });

                const resolvedFolder = await Node.resolve(await getAdminClient(), symlink.path);
                const resolvedSymlink = await Node.resolve(await getAdminClient(), symlink.path, { readlink: true });

                delete resolvedFolder.extra;
                delete folder.extra;

                assert.deepStrictEqual(resolvedFolder, folder);
                assert.deepStrictEqual(resolvedSymlink, symlink);
            });

            it("should resolve a symlink node more than one level", async () => {
                const root = await Node.resolve(await getAdminClient(), "/");
                const folder = await root.createChild(await getAdminClient(), "d", "folder");
                const subfolder = await folder.createChild(await getAdminClient(), "d", "subfolder");
                await root.createChild(await getAdminClient(), "s", "symlink", {
                    path: folder.path
                });
                const subsymlink = await folder.createChild(await getAdminClient(), "s", "symlink", {
                    path: subfolder.path
                });

                const resolvedSubfolder = await Node.resolve(await getAdminClient(), "/symlink/symlink");
                const resolvedSymlink = await Node.resolve(await getAdminClient(), "/symlink/symlink", { readlink: true });

                delete resolvedSymlink.path;
                delete subsymlink.path;
                delete resolvedSubfolder.extra;
                delete subfolder.extra;

                assert.deepStrictEqual(resolvedSubfolder, subfolder);
                assert.deepStrictEqual(resolvedSymlink, subsymlink);

                await assertThrows(() => Node.resolve(await getAdminClient(), "/symlink/symlink", { nofollow: true }));
            });
        });
    });
});
