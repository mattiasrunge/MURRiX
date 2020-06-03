"use strict";

const Node = require("../../../lib/Node");
const auth = require("../../../auth");
const mode = require("../../../lib/mode");

class Person extends Node {
    // Private

    static async _createData(client, parent, type, attributes = {}) {
        const data = await super._createData(client, parent, type, attributes);

        data.properties.acl.push({
            gid: auth.GID_CUSTODIANS,
            uid: null,
            mode: mode.getMode("rwx", mode.MASKS.ACL)
        });

        return data;
    }

    async _postCreate(client) {
        await this.createChild(client, "d", "children");
        await this.createChild(client, "d", "homes");
        await this.createChild(client, "d", "measurments");
        await this.createChild(client, "d", "parents");
        await this.createChild(client, "d", "texts");
    }


    // Getters

    static getActionTypes() {
        return super.getActionTypes().concat([
            {
                name: "mother",
                label: "Mother",
                type: "list",
                inputs: [
                    {
                        name: "mother",
                        type: "node",
                        paths: [ "/people" ]
                    }
                ],
                get: "getparent ${this.node.path} f", // eslint-disable-line no-template-curly-in-string
                add: "setparent ${this.node.path} f ${this.mother.path}", // eslint-disable-line no-template-curly-in-string
                remove: "setparent ${this.node.path} f" // eslint-disable-line no-template-curly-in-string
            },
            {
                name: "father",
                label: "Father",
                type: "list",
                inputs: [
                    {
                        name: "father",
                        type: "node",
                        paths: [ "/people" ]
                    }
                ],
                get: "getparent ${this.node.path} m", // eslint-disable-line no-template-curly-in-string
                add: "setparent ${this.node.path} m ${this.father.path}", // eslint-disable-line no-template-curly-in-string
                remove: "setparent ${this.node.path} m" // eslint-disable-line no-template-curly-in-string
            },
            {
                name: "children",
                label: "Children",
                type: "list",
                inputs: [
                    {
                        name: "child",
                        type: "node",
                        paths: [ "/people" ]
                    }
                ],
                get: "getchildren ${this.node.path}", // eslint-disable-line no-template-curly-in-string
                add: "setparent ${this.child.path} ${this.node.attributes.gender} ${this.node.path}", // eslint-disable-line no-template-curly-in-string
                remove: "setparent ${this.remove.path} ${this.node.attributes.gender}" // eslint-disable-line no-template-curly-in-string
            },
            {
                name: "partner",
                label: "Partner",
                type: "list",
                inputs: [
                    {
                        name: "partner",
                        type: "node",
                        paths: [ "/people" ]
                    }
                ],
                get: "getpartner ${this.node.path}", // eslint-disable-line no-template-curly-in-string
                add: "setpartner ${this.node.path} ${this.partner.path}", // eslint-disable-line no-template-curly-in-string
                remove: "setpartner ${this.node.path}" // eslint-disable-line no-template-curly-in-string
            }
        ]);
    }

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
            }
            // TODO: contact
        ]);
    }
}

Person.IDENTIFIER = "p";
Person.VERSION = 1;

module.exports = Person;
