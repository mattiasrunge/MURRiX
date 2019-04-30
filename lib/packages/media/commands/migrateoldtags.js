"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const list = require("../../vfs/commands/list");

module.exports = async (session, abspath) => {
    const node = await Node.resolve(session, abspath);

    assert(node.properties.type === "f", "Get only get tags of files");

    const faces = node.attributes.faces || [];
    const tags = await list(session, `${abspath}/tags`, { nofollow: true });

    const faceTags = tags
    .filter((tag) => !faces.some((face) => face.id === tag.name))
    .map((tag) => ({
        id: tag.name,
        x: tag.attributes.x,
        y: tag.attributes.y,
        w: tag.attributes.width,
        h: tag.attributes.height,
        detector: "manual"
    }));

    if (faceTags.length > 0) {
        node.update(session, {
            faces: faces.concat(faceTags)
        });
    }

    return node.attributes.faces;
};
