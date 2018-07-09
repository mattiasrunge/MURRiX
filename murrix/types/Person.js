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
                get: "murrix.getparent $this.path f",
                add: "murrix.setparent $this.path f $parent.path",
                remove: "murrix.setparent $this.path f"
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
                get: "murrix.getparent $this.path m",
                add: "murrix.setparent $this.path m $parent.path",
                remove: "murrix.setparent $this.path m"
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
                get: "murrix.getchildren $this.path",
                add: "murrix.setparent $child.path $this.attributes.gender $this.path",
                remove: "murrix.setparent $remove.path $this.attributes.gender"
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
                get: "murrix.getpartner $this.path",
                add: "murrix.setpartner $this.path $partner.path",
                remove: "murrix.setpartner $this.path"
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
