"use strict";

/* global describe before after it beforeEach afterEach */

const assert = require("assert");
const db = require("../../lib/db");

const { vfs, Node, auth } = require("../../vfs");

const createNodes = async (session) => {
    const root = await Node.resolve(session, "/");

    const folderA = await root.createChild(session, "d", "folderA");
    await folderA.createChild(session, "d", "folderA1");
    await folderA.createChild(session, "d", "folderA2");
    const folderB = await root.createChild(session, "d", "folderB");
    await folderB.createChild(session, "d", "folderB1");
    await folderB.createChild(session, "d", "folderB2");

    return root;
};

const destroyNodes = async (session) => {
    const root = await Node.resolve(session, "/");
    const children = await root.children(session, { nofollow: true });

    for (const child of children) {
        await root.removeChild(session, child);
        await child.remove(session);
    }
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

        describe("Commands", () => {
            beforeEach(async () => {
                await createNodes(auth.ADMIN_SESSION);
            });

            afterEach(async () => {
                await destroyNodes(auth.ADMIN_SESSION);
            });

            it("should resolve a folder and then find the same folder by id", async () => {
                const folder = await vfs.api.resolve(auth.ADMIN_SESSION, "/folderA/folderA1");

                assert(folder);

                const folder2 = await vfs.api.resolve(auth.ADMIN_SESSION, folder._id);

                assert.deepEqual(folder, folder2);
            });
        });
    });
});
