"use strict";

const Node = require("../../../core/Node");
const auth = require("../../../core/auth");
const mode = require("../../../core/mode");

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
                get: "getparent $this.path f",
                add: "setparent $this.path f $parent.path",
                remove: "setparent $this.path f"
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
                get: "getparent $this.path m",
                add: "setparent $this.path m $parent.path",
                remove: "setparent $this.path m"
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
                get: "getchildren $this.path",
                add: "setparent $child.path $this.attributes.gender $this.path",
                remove: "setparent $remove.path $this.attributes.gender"
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
                get: "getpartner $this.path",
                add: "setpartner $this.path $partner.path",
                remove: "setpartner $this.path"
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
