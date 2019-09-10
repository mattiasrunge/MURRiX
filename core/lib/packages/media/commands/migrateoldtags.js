"use strict";

const assert = require("assert");
const Node = require("../../../core/Node");
const log = require("../../../log")(module);
const list = require("../../vfs/commands/list");

module.exports = async (client, abspath) => {
    const node = await Node.resolve(client, abspath);

    assert(node.properties.type === "f", "Get only get tags of files");

    const faces = node.attributes.faces || [];
    try {
        const tags = await list(client, `${abspath}/tags`, { nofollow: true });

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
            node.update(client, {
                faces: faces.concat(faceTags)
            });
        }
    } catch (error) {
        log.error(`Failed to migrate tags for ${node.path}, will skip!`, error);
    }

    return node.attributes.faces;
};
