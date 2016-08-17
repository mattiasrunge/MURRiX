"use strict";

/* jslint bitwise: true */

const path = require("path");
const co = require("bluebird").coroutine;
const uuid = require("node-uuid");
const octal = require("octal");
const sha1 = require("sha1");
const fs = require("fs-extra-promise");
const api = require("api.io");
const db = require("../../core/lib/db");
const plugin = require("../../core/lib/plugin");

let params = {};

let vfs = api.register("vfs", {
    deps: [ ],
    init: co(function*(config) {
        params = config;

        if (!(yield db.findOne("nodes", { "properties.type": "r" }))) {
            console.log("No root node found, creating...");

            let root = {
                _id: uuid.v4(),
                properties: {
                    type: "r",
                    mode: octal("775"),
                    birthtime: new Date(),
                    birthuid: 1000,
                    ctime: new Date(),
                    cuid: 1000,
                    mtime: new Date(),
                    muid: 1000,
                    uid: 1000,
                    gid: 1000,
                    acl: [],
                    children: [],
                    count: 0
                },
                attributes: {}
            };

            yield db.insertOne("nodes", root);
        }

        yield db.createIndexes("nodes", [
            {
                key: {
                    "properties.type": 1
                }
            },
            {
                key: {
                    "properties.children.name": 1
                }
            },
            {
                key: {
                    "properties.children.id": 1
                }
            },
            {
                key: {
                    "attributes.name": 1
                }
            },
            {
                key: {
                    "attributes.time.timestamp": 1
                }
            },
            {
                key: {
                    "attributes.path": 1
                }
            }
        ]);
    }),
    access: function*(session, abspathOrNode, modestr) {
        let node = abspathOrNode;

        if (!session.username) {
            throw new Error("Corrupt session, please reinitialize");
        }

        if (session.almighty || session.username === "admin") {
            return true;
        }

        if (typeof node === "string") {
            node = yield vfs.resolve(session, abspathOrNode, { noerror: true });
        }

        if (!node || !node._id) {
            throw new Error("Node not valid, abspathOrNode was " + JSON.stringify(abspathOrNode, null, 2));
        }

        let mode = 0;

        try {
            if (node.properties.uid === session.uid) {
                mode += modestr.indexOf("r") !== -1 ? octal("400") : 0;
                mode += modestr.indexOf("w") !== -1 ? octal("200") : 0;
                mode += modestr.indexOf("x") !== -1 ? octal("100") : 0;
            } else if (session.gids.indexOf(node.properties.gid) !== -1) {
                mode += modestr.indexOf("r") !== -1 ? octal("040") : 0;
                mode += modestr.indexOf("w") !== -1 ? octal("020") : 0;
                mode += modestr.indexOf("x") !== -1 ? octal("010") : 0;
            } else {
                mode += modestr.indexOf("r") !== -1 ? octal("004") : 0;
                mode += modestr.indexOf("w") !== -1 ? octal("002") : 0;
                mode += modestr.indexOf("x") !== -1 ? octal("001") : 0;
            }
        } catch (e) {
            console.error(JSON.stringify(node, null, 2));
            throw e;
        }

        if ((node.properties.mode & mode) > 0) {
            return true;
        }

        if (node.properties.acl && node.properties.acl.length > 0) {
            for (let ac of node.properties.acl) {
                if ((ac.uid && ac.uid === session.uid) || (ac.gid && session.gids.indexOf(ac.gid) !== -1)) {
                    mode = 0;
                    mode += modestr.indexOf("r") !== -1 ? octal("004") : 0;
                    mode += modestr.indexOf("w") !== -1 ? octal("002") : 0;
                    mode += modestr.indexOf("x") !== -1 ? octal("001") : 0;

                    if ((ac.mode & mode) > 0) {
                        return true;
                    }
                }
            }
        }

        return false;
    },
    query: function*(session, query, options) {
        if (options && options.fields) {
            options.fields.properties = 1;
        }

        let nodes = yield db.find("nodes", query, options);
        let results = [];

        for (let node of nodes) {
            if (yield vfs.access(session, node, "r")) {
                results.push(node);
            }
        }

        return results;
    },
    queryOne: function*(session, query, options) {
        if (options && options.fields) {
            options.fields.properties = 1;
        }

        let node = yield db.findOne("nodes", query, options);

        if (node && !(yield vfs.access(session, node, "r"))) {
            throw new Error("Permission denied");
        }

        return node;
    },
    resolve: function*(session, abspath, options) {
        options = options || {};

        if (typeof abspath !== "string") {
            return abspath;
        }

        let pathParts = abspath.replace(/\/$/g, "").split("/");
        let root = yield db.findOne("nodes", { "properties.type": "r" });

        let getchild = co(function*(session, node, pathParts, options) {
            if (pathParts.length === 0) {
                if (!(yield vfs.access(session, node, "r"))) {
                    throw new Error("Permission denied");
                }

                return node;
            }

            let name = pathParts.shift();
            let child = node.properties.children.filter((child) => child.name === name)[0];

            if (!child) {
                if (options.noerror) {
                    return false;
                }

                throw new Error("No such (abspath=" + abspath + ") path: " + pathParts.join(":"));
            }

            node = yield db.findOne("nodes", { _id: child.id });

            if (!(yield vfs.access(session, node, "x"))) {
                if (options.noerror) {
                    return false;
                }

                throw new Error("Permission denied");
            }

            if (node.properties.type === "s" && !options.nofollow) {
                return vfs.resolve(session, path.join(node.attributes.path, pathParts.join("/")), options);
            }

            return getchild(session, node, pathParts, options);
        });

        pathParts.shift();
        return getchild(session, root, pathParts, options);
    },
    lookup: function*(session, id, cache) {
        cache = cache || {};

        if (cache[id]) {
            return cache[id];
        }

        let paths = [];
        let parents = yield db.find("nodes", { "properties.children.id": id }, {
            "properties.children": 1
        });

        if (parents.length === 0) {
            return [ "/" ];
        }

        for (let parent of parents) {
            let parentpaths = yield vfs.lookup(session, parent._id, cache);
            let names = parent.properties.children.filter((child) => child.id === id).map((child) => child.name);

            for (let parentpath of parentpaths) {
                for (let name of names) {
                    paths.push(path.join(parentpath, name));
                }
            }
        }

        cache[id] = paths;
        return cache[id];
    },
    ensure: function*(session, abspath, type, attributes) {
        let node = yield vfs.resolve(session, abspath, { noerror: true });

        if (!node) {
            node = yield vfs.create(session, abspath, type, attributes || {});
        }

        return node;
    },
    list: function*(session, abspath, options) {
        options = options || {};

        let hasFilter = !!options.filter;
        let query = options.filter || {};
        let list = [];
        let abspaths = abspath instanceof Array ? abspath : [ abspath ];

        for (let abspath of abspaths) {
            let parent = yield vfs.resolve(session, abspath, options);

            if (!parent) {
                continue;
            }

            if (!(yield vfs.access(session, parent, "r"))) {
                throw new Error("Permission denied");
            }

            if (options.reverse) {
                parent.properties.children.sort((a, b) => {
                    return b.name.localeCompare(a.name);
                });
            } else {
                parent.properties.children.sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });
            }

            let ids = parent.properties.children.map((child) => child.id);

            if (options.limit && !hasFilter) {
                ids = ids.slice(options.skip || 0, options.limit);
            }

            query._id = { $in: ids };

            let opts = {};

            if (options.limit && hasFilter) {
                opts.limit = options.limit;
                opts.skip = options.skip;
            }

            let nodes = yield db.find("nodes", query, opts);

            if (options.all) {
                let pparent = yield vfs.resolve(session, path.dirname(abspath));

                list.push({ name: ".", node: parent, path: abspath });
                list.push({ name: "..", node: pparent, path: path.dirname(abspath) });
            }

            for (let child of parent.properties.children) {
                let node = nodes.filter((node) => node._id === child.id)[0];
                let dir = path.join(abspath, child.name);

                if (node) {
                    let link;

                    if (node.properties.type === "s" && !options.nofollow) {
                        link = node;
                        dir = node.attributes.path;
                        node = yield vfs.resolve(session, node.attributes.path, { noerror: true });
                    }

                    if (node) {
                        let readable = yield vfs.access(session, node, "r");

                        if (readable) {
                            list.push({ name: child.name, node: node, path: dir, link: link });
                        }
                    }
                }
            }
        }

        if (options.reverse) {
            list.sort((a, b) => {
                return b.name.localeCompare(a.name);
            });
        } else {
            list.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
        }

        if (options.limit) {
            list = list.slice(options.skip || 0, options.limit);
        }

        return list;
    },
    random: function*(session, abspaths) {
        let list = [];
        let result = false;

        for (let abspath of abspaths) {
            let parent = yield vfs.resolve(session, abspath);

            if (!(yield vfs.access(session, parent, "r"))) {
                continue;
            }

            for (let child of parent.properties.children) {
                list.push({ id: child.id, name: child.name, path: path.join(abspath, child.name) });
            }
        }

        while (!result && list.length > 0) {
            let index = Math.floor(Math.random() * (list.length - 1)) + 1;
            let child = list.splice(index, 1)[0];
            let node = yield db.findOne("nodes", { _id: child.id });

            if (yield vfs.access(session, node, "r")) {
                result = { name: child.name, node: node, path: child.path };
            }
        }

        return result;
    },
    find: function*(session, abspath, search) {
        let list = [];
        let guard = [];
        let node = yield vfs.resolve(session, abspath);

        let rfind = co(function*(dir, node) {
            if ((yield vfs.access(session, node, "r"))) {
                for (let child of node.properties.children) {
                    if (guard.indexOf(child.id) === -1) {
                        guard.push(child.id);

                        let node = yield db.findOne("nodes", { _id: child.id });

                        if (child.name.indexOf(search) !== -1) {
                            list.push(path.join(dir, child.name));
                        }

                        yield rfind(path.join(dir, child.name), node);
                    }
                }
            }
        });

        yield rfind(abspath, node);

        return list;
    },
    setfacl: function*(session, abspath, ac, options) {
        let node = yield vfs.resolve(session, abspath, { nofollow: true });

        options = options || {};

        if (!(yield vfs.access(session, node, "w"))) {
            throw new Error("Permission denied");
        }

        node.properties.ctime = new Date();
        node.properties.cuid = session.uid;

        if (!ac) {
            node.properties.acl = [];
        } else {
            node.properties.acl = node.properties.acl || [];

            let current = node.properties.acl.filter((item) => item.uid === ac.uid || item.gid === ac.gid)[0];

            if (current) {
                let index = node.properties.acl.indexOf(current);
                node.properties.acl.splice(index, 1);
            }

            if (ac.mode > 0) {
                node.properties.acl.push({
                    gid: ac.gid,
                    uid: ac.uid,
                    mode: ac.mode
                });
            }
        }

        yield db.updateOne("nodes", node);

        plugin.emit("vfs.setfacl", {
            uid: session.uid,
            path: abspath,
            ac: ac
        });

        vfs.emit("update", { path: abspath });

        if (options.recursive && node.properties.type !== "s") {
            let children = yield vfs.list(session, abspath, { nofollow: true });

            for (let child of children) {
                yield vfs.setfacl(session, child.path, ac, options);
            }
        }
    },
    chmod: function*(session, abspath, mode, options) {
        let node = yield vfs.resolve(session, abspath, { nofollow: true });

        options = options || {};

        if (!(yield vfs.access(session, node, "w"))) {
            throw new Error("Permission denied");
        }

        node.properties.ctime = new Date();
        node.properties.cuid = session.uid;
        node.properties.mode = octal(mode);

        yield db.updateOne("nodes", node);

        plugin.emit("vfs.chmod", {
            uid: session.uid,
            path: abspath,
            mode: mode
        });

        vfs.emit("update", { path: abspath });

        if (options.recursive && node.properties.type !== "s") {
            let children = yield vfs.list(session, abspath, { nofollow: true });

            for (let child of children) {
                yield vfs.chmod(session, child.path, mode, options);
            }
        }
    },
    chown: function*(session, abspath, username, group, options) {
        let node = yield vfs.resolve(session, abspath, { nofollow: true });

        options = options || {};

        if (!(yield vfs.access(session, node, "w"))) {
            throw new Error("Permission denied");
        }

        node.properties.ctime = new Date();
        node.properties.cuid = session.uid;

        if (username) {
            if (typeof username === "number") {
                node.properties.uid = username;
            } else {
                node.properties.uid = yield api.auth.uid(session, username);
            }
        }

        if (group) {
            if (typeof group === "number") {
                node.properties.gid = group;
            } else {
                node.properties.gid = yield api.auth.gid(session, group);
            }
        }

        yield db.updateOne("nodes", node);

        plugin.emit("vfs.chown", {
            path: abspath,
            uid: node.properties.uid,
            gid: node.properties.gid
        });

        vfs.emit("update", { path: abspath });

        if (options.recursive && node.properties.type !== "s") {
            let children = yield vfs.list(session, abspath, { nofollow: true });

            for (let child of children) {
                yield vfs.chown(session, child.path, username, group, options);
            }
        }
    },
    setattributes: function*(session, abspath, attributes) {
        let node = yield vfs.resolve(session, abspath, { nofollow: true });

        if (!(yield vfs.access(session, node, "w"))) {
            throw new Error("Permission denied");
        }

        node.properties.ctime = new Date();
        node.properties.mtime = new Date();
        node.properties.cuid = session.uid;
        node.properties.muid = session.uid;

        for (let key of Object.keys(attributes)) {
            if (attributes[key] !== null) {
                node.attributes[key] = attributes[key];
            } else {
                delete node.attributes[key];
            }
        }

        yield db.updateOne("nodes", node);

        plugin.emit("vfs.attributes", {
            uid: session.uid,
            path: abspath,
            attributes: attributes
        });

        vfs.emit("update", { path: abspath });

        return node;
    },
    setproperties: function*(session, abspath, properties) {
        if (session.username !== "admin") {
            throw new Error("Permission denied");
        }

        let node = yield vfs.resolve(session, abspath, { nofollow: true });

        for (let key of Object.keys(properties)) {
            if (properties[key] !== null) {
                node.properties[key] = properties[key];
            } else {
                delete node.properties[key];
            }
        }

        yield db.updateOne("nodes", node);

        plugin.emit("vfs.properties", {
            uid: session.uid,
            path: abspath,
            properties: properties
        });

        vfs.emit("update", { path: abspath });

        return node;
    },
    create: function*(session, abspath, type, attributes) {
        let parentPath = path.dirname(abspath);
        let parent = yield vfs.resolve(session, parentPath);
        let name = path.basename(abspath);
        let exists = parent.properties.children.filter((child) => child.name === name).length > 0;

        if (exists) {
            throw new Error(abspath + " already exists");
        }

        if (!(yield vfs.access(session, parent, "w"))) {
            throw new Error("Permission denied");
        }

        let node = {
            _id: uuid.v4(),
            properties: {
                type: type,
                mode: session.umask ? octal(session.umask) : parent.properties.mode,
                birthtime: new Date(),
                birthuid: session.uid,
                ctime: new Date(),
                cuid: session.uid,
                mtime: new Date(),
                muid: session.uid,
                uid: session.uid,
                gid: parent.properties.gid,
                acl: parent.properties.acl || [],
                children: [],
                count: 1
            },
            attributes: attributes || {}
        };

        node.attributes.labels = node.attributes.labels || [];

        if (type === "u") {
            node.attributes.password = sha1(name);
            node.properties.mode = octal("770");
        } else if (type === "g") {
            node.properties.mode = octal("770");
        } else if (type === "f") {
            if (!node.attributes.name) {
                throw new Error("File must have a filename attribute");
            }

            let ext = path.extname(node.attributes.name);
            let source = node.attributes._source;
            delete node.attributes._source;

            node.attributes.diskfilename = node._id + ext;

            let diskfilepath = path.join(params.fileDirectory, node.attributes.diskfilename);

            if (source.mode === "symlink") {
                yield fs.ensureSymlinkAsync(source.filename, diskfilepath);
            } else if (source.mode === "copy") {
                yield fs.copyAsync(source.filename, diskfilepath);
            } else {
                // TODO: Default should be hard link?
                yield fs.moveAsync(source.filename, diskfilepath);
            }
        }

        parent.properties.children.push({ id: node._id, name: name });

        yield db.insertOne("nodes", node);
        yield db.updateOne("nodes", parent);

        plugin.emit("vfs.created", {
            uid: session.uid,
            path: abspath,
            node: node
        });

        plugin.emit("vfs.childAdded", {
            uid: session.uid,
            path: parentPath,
            name: name
        });

        vfs.emit("new", { path: abspath });
        vfs.emit("update", { path: parentPath });

        return node;
    },
    unlink: function*(session, abspath) {
        let parentPath = path.dirname(abspath);
        let parent = yield vfs.resolve(session, parentPath, { nofollow: true });
        let name = path.basename(abspath);
        let child = parent.properties.children.filter((child) => child.name === name)[0];

        if (!child) {
            return;
        }

        if (!(yield vfs.access(session, parent, "w"))) {
            throw new Error("Permission denied");
        }

        parent.properties.children = parent.properties.children.filter((child) => child.name !== name);
        parent.properties.ctime = new Date();
        parent.properties.cuid = session.uid;
        yield db.updateOne("nodes", parent);

        plugin.emit("vfs.childRemoved", {
            uid: session.uid,
            path: parentPath,
            name: name
        });

        vfs.emit("update", { path: parentPath });

        let rremove = co(function*(abspath, id) {
            let node = yield db.findOne("nodes", { _id: id });

            if (!node) {
                throw new Error("Could not find node with id " + id + " and abspath " + abspath + " while removing");
            }

            if (node.properties.count > 1) {
                node.properties.count--;

                yield db.updateOne("nodes", node);
            } else {
                yield db.removeOne("nodes", id);

                if (node.properties.type === "f") {
                    yield fs.removeAsync(path.join(params.fileDirectory, node.attributes.diskfilename));
                }

                for (let child of node.properties.children) {
                    yield rremove(path.join(abspath, child.name), child.id);
                }

                plugin.emit("vfs.removed", {
                    uid: session.uid,
                    path: abspath,
                    name: path.basename(abspath)
                });

                vfs.emit("removed", { path: abspath });
            }
        });

        yield rremove(abspath, child.id);
    },
    symlink: function*(session, srcpath, destpath) {
        yield vfs.resolve(session, srcpath);
        let name = path.basename(srcpath);

        if (yield vfs.resolve(session, destpath, { noerror: true })) {
            destpath = destpath + "/" + name;
        }

        return yield vfs.create(session, destpath, "s", {
            path: srcpath
        });
    },
    link: function*(session, srcpath, destpath) {
        let srcnode = yield vfs.resolve(session, srcpath, { nofollow: true });

        if (!(yield vfs.access(session, srcnode, "r"))) {
            throw new Error("Permission denied");
        }

        let name = "_unamed_";

        let destnode = yield vfs.resolve(session, destpath, { noerror: true });

        if (!destnode) {
            name = path.basename(destpath);
            destpath = path.dirname(destpath);
            destnode = yield vfs.resolve(session, destpath);
        } else if (typeof srcpath !== "string") {
            throw new Error("Source node supplied, destpath must have fully qualified name");
        } else {
            name = path.basename(srcpath);
        }

        if (!(yield vfs.access(session, destnode, "w"))) {
            throw new Error("Permission denied");
        }

        let destchild = destnode.properties.children.filter((child) => child.name === name)[0];

        if (destchild) {
            throw new Error(destpath + "/" + name + " already exists");
        }

        destnode.properties.children.push({ id: srcnode._id, name: name });
        destnode.properties.ctime = new Date();
        destnode.properties.cuid = session.uid;
        yield db.updateOne("nodes", destnode);

        srcnode.properties.count++;
        yield db.updateOne("nodes", srcnode);

        plugin.emit("vfs.childAdded", {
            uid: session.uid,
            path: destpath,
            name: name
        });

        vfs.emit("update", { path: destpath });
    },
    move: function*(session, srcpath, destpath) {
        let srcparentPath = path.dirname(srcpath);
        let srcparent = yield vfs.resolve(session, srcparentPath);
        let name = path.basename(srcpath);
        let child = srcparent.properties.children.filter((child) => child.name === name)[0];

        if (!child) {
            throw new Error(srcpath + " does not exists");
        }

        if (!(yield vfs.access(session, srcparent, "w"))) {
            throw new Error("Permission denied");
        }

        srcparent.properties.children = srcparent.properties.children.filter((child) => child.name !== name);
        srcparent.properties.ctime = new Date();
        srcparent.properties.cuid = session.uid;

        let destparentPath = path.dirname(destpath) === path.dirname(srcpath) ? srcparentPath : path.dirname(destpath);
        let destparent = path.dirname(destpath) === path.dirname(srcpath) ? srcparent : yield vfs.resolve(session, path.dirname(destpath));
        let destchild = destparent.properties.children.filter((child) => child.name === path.basename(destpath))[0];

        if (destchild) {
            destparent = yield db.findOne("nodes", { _id: destchild.id });
            destchild = destparent.properties.children.filter((child) => child.name === name)[0];

            if (destchild) {
                throw new Error(path.join(destpath, destchild.name) + " already exists");
            }
        } else if (destpath !== "/") {
            child.name = path.basename(destpath);
        }

        if (!(yield vfs.access(session, destparent, "w"))) {
            throw new Error("Permission denied");
        }

        yield db.updateOne("nodes", srcparent);

        destparent.properties.children.push(child);
        destparent.properties.ctime = new Date();
        destparent.properties.cuid = session.uid;

        yield db.updateOne("nodes", destparent);

        plugin.emit("vfs.childRemoved", {
            uid: session.uid,
            path: srcparentPath,
            name: name
        });

        plugin.emit("vfs.childAdded", {
            uid: session.uid,
            path: destparentPath,
            name: name
        });

        vfs.emit("update", { path: srcparentPath });
        vfs.emit("update", { path: destparentPath });
    },
    copy: function*(session, srcpath, destpath) {
        let srcparent = yield vfs.resolve(session, path.dirname(srcpath));
        let name = path.basename(srcpath);
        let child = srcparent.properties.children.filter((child) => child.name === name)[0];

        if (!child) {
            throw new Error(srcpath + " does not exists");
        }

        if (!(yield vfs.access(session, srcparent, "r"))) {
            throw new Error("Permission denied");
        }

        let destparentPath = path.dirname(destpath);
        let destparent = yield vfs.resolve(session, destparentPath);
        let destchild = destparent.properties.children.filter((child) => child.name === path.basename(destpath))[0];

        if (destchild) {
            destparent = yield db.findOne("nodes", { _id: destchild.id });
            destchild = destparent.properties.children.filter((child) => child.name === name)[0];

            if (destchild) {
                throw new Error(destpath + " already exists");
            }
        } else if (destpath !== "/") {
            child.name = path.basename(destpath);
        }

        let rcopy = co(function*(abspath, id) {
            let node = yield db.findOne("nodes", { _id: id });

            node._id = uuid.v4();
            node.properties.birthtime = new Date();
            node.properties.ctime = new Date();
            node.properties.cuid = session.uid;
            node.properties.mtime = new Date();
            node.properties.muid = session.uid;
            node.properties.uid = session.uid;
            node.properties.gid = session.gid;
            node.properties.count = 1;
            node.properties.mode = octal(session.umask || "755");

            for (let child of node.properties.children) {
                child.id = yield rcopy(path.join(abspath, child.name), child.id);
            }

            if (node.properties.type === "f") {
                let olddiskfilepath = path.join(params.fileDirectory, node.attributes.diskfilename);
                let ext = path.extname(node.attributes.filename);

                node.attributes.diskfilename = node._id + ext;

                let newdiskfilepath = path.join(params.fileDirectory, node.attributes.diskfilename);

                yield fs.copyAsync(olddiskfilepath, newdiskfilepath);
            }

            yield db.insertOne("nodes", node);

            plugin.emit("vfs.created", {
                uid: session.uid,
                path: abspath,
                node: node
            });

            vfs.emit("new", { path: abspath });

            return node._id;
        });

        if (!(yield vfs.access(session, destparent, "w"))) {
            throw new Error("Permission denied");
        }

        child.id = yield rcopy(destpath, child.id);

        destparent.properties.children.push(child);
        yield db.updateOne("nodes", destparent);

        plugin.emit("vfs.childAdded", {
            uid: session.uid,
            path: destparentPath,
            name: name
        });

        vfs.emit("update", { path: destparentPath });
    },
    allocateUploadId: function*(session) {
        let id = uuid.v4();

        if (!session.uploads) {
            session.uploads = [];
        }

        session.uploads[id] = true;
        return id;
    }
});

module.exports = vfs;
