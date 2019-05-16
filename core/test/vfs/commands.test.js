"use strict";

/* global describe beforeAll afterAll it beforeEach afterEach */

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

const createNodes = async (client) => {
    const root = await Node.resolve(client, "/");

    const folderA = await root.createChild(client, "d", "folderA");
    await folderA.createChild(client, "d", "folderA1");
    await folderA.createChild(client, "d", "folderA2");
    const folderB = await root.createChild(client, "d", "folderB");
    await folderB.createChild(client, "d", "folderB1");
    await folderB.createChild(client, "d", "folderB2");

    return root;
};

const destroyNodes = async (client) => {
    const root = await Node.resolve(client, "/");
    const children = await root.children(client, { nofollow: true });

    for (const child of children) {
        await root.removeChild(client, child);
        await child.remove(client);
    }
};

describe("Test", () => {
    describe("VFS", () => {
        beforeAll(async () => {
            await db.init({ mongoUrl: "mongodb://localhost:27017/murrix_test_commands" });
            await db.dropDatabase();
            await core.init();
        }, 15000);

        afterAll(async () => {
            await db.dropDatabase();
            await db.stop();
        });

        describe("Commands", () => {
            beforeEach(async () => {
                await createNodes(ADMIN_CLIENT);
            });

            afterEach(async () => {
                await destroyNodes(ADMIN_CLIENT);
            });

            it("should resolve a folder and then find the same folder by id", async () => {
                const folder = await core.commands.resolve(ADMIN_CLIENT, "/folderA/folderA1");

                assert(folder);

                const folder2 = await core.commands.resolve(ADMIN_CLIENT, folder._id);

                assert.deepStrictEqual(folder, folder2);
            });
        });
    });
});
