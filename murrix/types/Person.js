"use strict";

const { Node } = require("../../vfs");

class Person extends Node {
    // Private

    async _postCreate(session) {
        await this.createChild(session, "d", "children");
        await this.createChild(session, "d", "homes");
        await this.createChild(session, "d", "measurments");
        await this.createChild(session, "d", "parents");
        await this.createChild(session, "d", "texts");
    }


    // Getters

    static getAttributeTypes() {
        return super.getAttributeTypes().concat([
            {
                name: "fullname",
                label: "Full name",
                type: "textline"
            },
            {
                name: "birthname",
                label: "Birth name",
                type: "textline"
            },
            {
                name: "gender",
                label: "Gender",
                type: "select",
                options: { m: "Male", f: "Female" }
            },
            {
                name: "allergies",
                label: "Allergies",
                type: "text"
            },
            // TODO: contact
            {
                name: "partner",
                label: "Partner",
                type: "cmd",
                inputs: {
                    partner: "select"
                },
                get: "getpartner {node.path}",
                set: "setpartner {node.path} {partner.path}"
            },
            {
                name: "mother",
                label: "Mother",
                type: "cmd",
                inputs: {
                    mother: "select"
                },
                get: "getparent {node.path} f",
                set: "setparent {node.path} f {mother.path}"
            },
            {
                name: "father",
                label: "Father",
                type: "cmd",
                inputs: {
                    father: "select"
                },
                get: "getparent {node.path} m",
                set: "setparent {node.path} m {father.path}"
            }
        ]);
    }
}

Person.IDENTIFIER = "p";
Person.VERSION = 1;

module.exports = Person;
