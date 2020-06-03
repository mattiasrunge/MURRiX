"use strict";

/* global describe beforeAll afterAll it beforeEach afterEach */

const assert = require("assert");
const db = require("../../lib/db");
const packages = require("../../lib/packages");
const commander = require("../../lib/commander");
const { api } = require("../../lib/api");
const Node = require("../../lib/lib/Node");
const { ADMIN_CLIENT } = require("../../lib/auth");
const configuration = require("../../lib/config");

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
                await createNodes(ADMIN_CLIENT);
            });

            afterEach(async () => {
                await destroyNodes(ADMIN_CLIENT);
            });

            it("should resolve a folder and then find the same folder by id", async () => {
                const folder = await api.resolve(ADMIN_CLIENT, "/folderA/folderA1");

                assert(folder);

                const folder2 = await api.resolve(ADMIN_CLIENT, folder._id);

                assert.deepStrictEqual(folder, folder2);
            });
        });
    });
});
