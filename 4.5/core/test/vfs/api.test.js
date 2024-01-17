"use strict";

/* global describe beforeAll afterAll it beforeEach afterEach */

const assert = require("assert");
const db = require("../../lib/db/index.mjs").default;
const packages = require("../../lib/packages/index.mjs").default;
const commander = require("../../lib/commander/index.mjs").default;
const { api } = require("../../lib/api/index.mjs").default;
const Node = require("../../lib/lib/Node.mjs").default;
const { getAdminClient } = require("../../lib/auth/index.mjs").default;
const configuration = require("../../lib/config/index.mjs");

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
            configuration.mongoUrl = "mongodb://localhost:27017/murrix_test_api";
            await db.init();
            await db.dropDatabase();
            await commander.init();
            await packages.init();
        }, 15000);

        afterAll(async () => {
            await db.dropDatabase();
            await db.stop();
        });

        describe("Api", () => {
            beforeEach(async () => {
                await createNodes(await getAdminClient());
            });

            afterEach(async () => {
                await destroyNodes(await getAdminClient());
            });

            it("should resolve a folder and then find the same folder by id", async () => {
                const folder = await api.resolve(await getAdminClient(), "/folderA/folderA1");

                assert(folder);

                const folder2 = await api.resolve(await getAdminClient(), folder._id);

                assert.deepStrictEqual(folder, folder2);
            });
        });
    });
});
