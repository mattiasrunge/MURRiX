"use strict";

/* jslint bitwise: true */

const path = require("path");
const uuid = require("uuid");
const sha1 = require("sha1");
const shuffle = require("shuffle-array");
const fs = require("fs-extra-promise");
const api = require("api.io");
const db = require("../../lib/db");
const bus = require("../../lib/bus");
const log = require("../../lib/log")(module);



const resolve = require("./methods/resolve");


const Type = require("../../vfs/lib/Type");
const Root = require("../../vfs/types/Root");
const { MASKS } = require("../../vfs/lib/mode");
const vfs = require("../../vfs");

module.exports = api.register("vfs", {
    deps: [],
    MASK_OWNER_READ: MASKS.OWNER.READ,
    MASK_OWNER_WRITE: MASKS.OWNER.WRITE,
    MASK_OWNER_EXEC: MASKS.OWNER.EXEC,
    MASK_GROUP_READ: MASKS.GROUP.READ,
    MASK_GROUP_WRITE: MASKS.GROUP.WRITE,
    MASK_GROUP_EXEC: MASKS.GROUP.EXEC,
    MASK_OTHER_READ: MASKS.OTHER.READ,
    MASK_OTHER_WRITE: MASKS.OTHER.WRITE,
    MASK_OTHER_EXEC: MASKS.OTHER.EXEC,
    MASK_ACL_READ: MASKS.ACL.READ,
    MASK_ACL_WRITE: MASKS.ACL.WRITE,
    MASK_ACL_EXEC: MASKS.ACL.EXEC,
    init: async () => {
        const root = await Type.resolve({ admin: true }, "/");

        if (!root) {
            log.info("No root node found, creating...");
            await Root.create({ admin: true });
        }
    },
    access: api.export(vfs.api.access),
    aggregate: api.export(vfs.api.aggregate),
    query: api.export(vfs.api.query),
    normalize: api.export(vfs.api.normalize),
    uniqueName: api.export(vfs.api.uniquename),
    resolve: api.export(async (session, abspath, options = {}) => {
        if (!options.nodepath) {
            console.error("Calling resolve without nodepath is deprecated", abspath, new Error().stack);

            return resolve(session, abspath, options);
        }

        return vfs.api.resolve(session, abspath, options);
    }),
    ensure: api.export(async (session, abspath, type, attributes) => {
        let node = await vfs.api.resolve(session, abspath, { noerror: true });

        if (!node) {
            node = await vfs.api.create(session, abspath, type, attributes);
        }

        return node;
    }),
    list: api.export(vfs.api.list),
    // list: api.export(async (session, abspath, options) => {
    //     options = options || {};
    //
    //     const hasFilter = !!options.filter;
    //     const query = options.filter || {};
    //     let list = [];
    //     const abspaths = abspath instanceof Array ? abspath : [ abspath ];
    //
    //     for (let abspath of abspaths) {
    //         abspath = abspath.replace(/\/$/, "");
    //         const slashIndex = abspath.lastIndexOf("/");
    //         const lastPart = abspath.substr(slashIndex + 1);
    //         const pattern = lastPart.includes("*") ? lastPart.replace("*", ".*?") : false;
    //         abspath = pattern ? abspath.substr(0, slashIndex) : abspath;
    //
    //         // TODO: Filter options, sending in nodepath breaks things!
    //         const parent = await vfs.resolve(session, abspath, options);
    //
    //         if (!parent) {
    //             continue;
    //         }
    //
    //         if (!(await vfs.access(session, parent, "r"))) {
    //             throw new Error("Permission denied");
    //         }
    //
    //         let children = parent.properties.children;
    //
    //         if (pattern) {
    //             children = children.filter((child) => child.name.match(new RegExp(`^${pattern}$`)));
    //         }
    //
    //         if (options.reverse) {
    //             children.sort((a, b) => {
    //                 return b.name.localeCompare(a.name);
    //             });
    //         } else {
    //             children.sort((a, b) => {
    //                 return a.name.localeCompare(b.name);
    //             });
    //         }
    //
    //         let ids = children.map((child) => child.id);
    //
    //         if (options.limit && !hasFilter) {
    //             ids = ids.slice(options.skip || 0, options.limit);
    //         }
    //
    //         query._id = { $in: ids };
    //
    //         const opts = {};
    //
    //         if (options.limit && hasFilter) {
    //             opts.limit = options.limit;
    //             opts.skip = options.skip;
    //         }
    //
    //         const nodes = await db.find("nodes", query, opts);
    //
    //         if (options.all) {
    //             const pparent = await vfs.resolve(session, path.dirname(abspath));
    //
    //             list.push({ name: ".", node: parent, path: abspath });
    //             list.push({ name: "..", node: pparent, path: path.dirname(abspath) });
    //         }
    //
    //         for (const child of children) {
    //             let node = nodes.filter((node) => node._id === child.id)[0];
    //             let dir = path.join(abspath, child.name);
    //
    //             if (node) {
    //                 let link;
    //
    //                 if (node.properties.type === "s" && !options.nofollow) {
    //                     link = node;
    //                     dir = node.attributes.path;
    //                     node = await vfs.resolve(session, node.attributes.path, { noerror: true });
    //                 }
    //
    //                 if (node) {
    //                     const readable = await vfs.access(session, node, "r");
    //                     let editable;
    //
    //                     if (options.checkwritable) {
    //                         editable = await vfs.access(session, node, "w");
    //                     }
    //
    //                     if (readable) {
    //                         list.push({ name: child.name, node: node, path: dir, link: link, editable: editable });
    //                     }
    //                 }
    //             }
    //         }
    //     }
    //
    //     if (options.reverse) {
    //         list.sort((b, a) => {
    //             if (!a.node.attributes.time) {
    //                 return a.name.localeCompare(b.name);
    //             } else if (!b.node.attributes.time) {
    //                 return b.name.localeCompare(a.name);
    //             }
    //
    //             return a.node.attributes.time.timestamp - b.node.attributes.time.timestamp;
    //         });
    //     } else {
    //         list.sort((a, b) => {
    //             if (!a.node.attributes.time) {
    //                 return a.name.localeCompare(b.name);
    //             } else if (!b.node.attributes.time) {
    //                 return b.name.localeCompare(a.name);
    //             }
    //
    //             return a.node.attributes.time.timestamp - b.node.attributes.time.timestamp;
    //         });
    //     }
    //
    //     if (options.shuffle) {
    //         list = shuffle(list);
    //     }
    //
    //     if (options.limit) {
    //         list = list.slice(options.skip || 0, options.limit);
    //     }
    //
    //     return list;
    // }),
    random: api.export(vfs.api.random),
    find: api.export(vfs.api.find),
    setfacl: api.export(vfs.api.setfacl),
    chmod: api.export(vfs.api.chmod),
    chown: api.export(vfs.api.chown),
    setattributes: api.export(vfs.api.update),
    create: api.export(vfs.api.create),
    // create: api.export(async (session, abspath, type, attributes) => {
    //     const parentPath = path.dirname(abspath);
    //     const parent = await vfs.resolve(session, parentPath);
    //     const name = path.basename(abspath);
    //     const exists = parent.properties.children.filter((child) => child.name === name).length > 0;
    //
    //     if (exists) {
    //         throw new Error(`${abspath} already exists`);
    //     }
    //
    //     if (!(await vfs.access(session, parent, "w"))) {
    //         throw new Error("Permission denied");
    //     }
    //
    //     const node = {
    //         _id: uuid.v4(),
    //         properties: {
    //             type: type,
    //             mode: session.umask ? session.umask : parent.properties.mode,
    //             birthtime: new Date(),
    //             birthuid: session.uid,
    //             ctime: new Date(),
    //             cuid: session.uid,
    //             mtime: new Date(),
    //             muid: session.uid,
    //             uid: session.uid,
    //             gid: parent.properties.gid,
    //             acl: parent.properties.acl || [],
    //             children: [],
    //             count: 1
    //         },
    //         attributes: attributes || {}
    //     };
    //
    //     node.attributes.labels = node.attributes.labels || [];
    //
    //     if (type === "u") {
    //         node.attributes.password = sha1(name);
    //         node.properties.mode = 0o770;
    //     } else if (type === "g") {
    //         node.properties.mode = 0o770;
    //     } else if (type === "f") {
    //         if (!node.attributes.name) {
    //             throw new Error("File must have a filename attribute");
    //         }
    //
    //         const ext = path.extname(node.attributes.name);
    //         const source = node.attributes._source;
    //         delete node.attributes._source;
    //
    //         node.attributes.diskfilename = node._id + ext;
    //
    //         const diskfilepath = path.join(params.fileDirectory, node.attributes.diskfilename);
    //
    //         if (source.mode === "symlink") {
    //             await fs.ensureSymlinkAsync(source.filename, diskfilepath);
    //         } else if (source.mode === "copy") {
    //             await fs.copyAsync(source.filename, diskfilepath);
    //         } else if (source.mode === "link") {
    //             await fs.ensureLinkAsync(source.filename, diskfilepath);
    //         } else if (source.mode === "rsymlink") {
    //             await fs.moveAsync(source.filename, diskfilepath);
    //             await fs.ensureSymlinkAsync(diskfilepath, source.filename);
    //         } else {
    //             await fs.moveAsync(source.filename, diskfilepath);
    //         }
    //     }
    //
    //     parent.properties.children.push({ id: node._id, name: name });
    //
    //     await db.insertOne("nodes", node);
    //     await db.updateOne("nodes", parent);
    //
    //     bus.emit("vfs.created", {
    //         uid: session.uid,
    //         path: abspath,
    //         node: node
    //     });
    //
    //     bus.emit("vfs.childAdded", {
    //         uid: session.uid,
    //         path: parentPath,
    //         name: name
    //     });
    //
    //     await vfs.emitEvent(session, "new", abspath);
    //     await vfs.emitEvent(session, "update", parentPath);
    //
    //     return node;
    // }),
    unlink: api.export(vfs.api.unlink),
    symlink: api.export(vfs.api.symlink),
    link: api.export(vfs.api.link),
    move: api.export(vfs.api.move),
    copy: api.export(vfs.api.copy),
    allocateUploadId: api.export(async (session) => {
        const id = uuid.v4();

        if (!session.uploads) {
            session.uploads = [];
        }

        session.uploads[id] = true;

        return id;
    }),
    labels: api.export(vfs.api.labels)
});
