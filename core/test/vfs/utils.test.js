"use strict";

/* global describe it */

const assert = require("assert");
const { unpackObjectKeys } = require("../../lib/lib/utils");

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

                const newObj = unpackObjectKeys(obj);

                assert.deepStrictEqual(obj, {
                    hej: {
                        tjo: "hej"
                    },
                    "hej.hi": "go"
                });

                assert.deepStrictEqual(newObj, {
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

                const newObj = unpackObjectKeys(obj);

                assert.deepStrictEqual(newObj, {
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
