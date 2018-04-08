"use strict";

/* global describe it */

const assert = require("assert");
const utils = require("../../vfs/lib/utils");

describe("Test", () => {
    describe("VFS", () => {
        describe("utils", () => {
            it("should unpackObjectKeys one level", () => {
                const obj = {
                    hej: {
                        tjo: "hej"
                    },
                    "hej.hi": "go"
                };

                const newObj = utils.unpackObjectKeys(obj);

                assert.deepEqual(obj, {
                    hej: {
                        tjo: "hej"
                    },
                    "hej.hi": "go"
                });

                assert.deepEqual(newObj, {
                    hej: {
                        tjo: "hej",
                        hi: "go"
                    }
                });
            });

            it("should unpackObjectKeys two levels", () => {
                const obj = {
                    hej: {
                        tjo: "hej"
                    },
                    "hej.hi.ho": "go"
                };

                const newObj = utils.unpackObjectKeys(obj);

                assert.deepEqual(newObj, {
                    hej: {
                        tjo: "hej",
                        hi: {
                            ho: "go"
                        }
                    }
                });
            });
        });
    });
});
