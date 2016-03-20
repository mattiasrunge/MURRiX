"use strict";

/* jslint bitwise: true */

const path = require("path");
const co = require("bluebird").coroutine;
const promisifyAll = require("bluebird").promisifyAll;
const uuid = require("node-uuid");
const octal = require("octal");
const sha1 = require("sha1");
const fs = require("fs-extra-promise");
const mime = require("mime");
const checksum = promisifyAll(require("checksum"));
const api = require("api.io");
const db = require("../db");

let params = {};

let vfs = api.register("vfs", {
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
                    ctime: new Date(),
                    mtime: new Date(),
                    uid: 1000,
                    gid: 1000,
                    children: [],
                    count: 0
                },
                attributes: {}
            };

            yield db.insertOne("nodes", root);
        }
    }),
    access: function*(session, abspathOrNode, modestr) {
        let node = abspathOrNode;

        if (typeof node === "string") {
            node = yield vfs.resolve(session, abspathOrNode);
        }

        let mode = 0;

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

        return (node.properties.mode & mode) > 0;
    },
    resolve: function*(session, abspath, noerror) {
        let pathParts = abspath.replace(/\/$/g, "").split("/");
        let root = yield db.findOne("nodes", { "properties.type": "r" });

        let getchild = co(function*(session, node, pathParts, noerror) {
            if (pathParts.length === 0) {
                return node;
            }

            let name = pathParts.shift();
            let child = node.properties.children.filter((child) => child.name === name)[0];

            if (!child) {
                if (noerror) {
                    return false;
                }

                throw new Error("No such path");
            }

            node = yield db.findOne("nodes", { _id: child.id });

            if (!(yield vfs.access(session, node, "r"))) {
                throw new Error("Permission denied");
            }

            return getchild(session, node, pathParts, noerror);
        });

        pathParts.shift();
        return getchild(session, root, pathParts, noerror);
    },
    ensure: function*(session, abspath, type, attributes) {
        let node = yield vfs.resolve(session, abspath, true);

        if (!node) {
            node = yield vfs.create(session, abspath, type, attributes || {});
        }

        return node;
    },
    list: function*(session, abspath, all) {
        let list = [];
        let parent = yield vfs.resolve(session, abspath);

        if (!(yield vfs.access(session, parent, "r"))) {
            throw new Error("Permission denied");
        }

        let ids = parent.properties.children.map((child) => child.id);
        let nodes = yield db.find("nodes", { _id: { $in: ids } });

        if (all) {
            let pparent = yield vfs.resolve(session, path.dirname(abspath));

            list.push({ name: ".", node: parent });
            list.push({ name: "..", node: pparent });
        }

        for (let child of parent.properties.children) {
            let node = nodes.filter((node) => node._id === child.id)[0];

            list.push({ name: child.name, node: node });
        }

        list.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        return list;
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
    chmod: function*(session, abspath, mode) {
        let node = yield vfs.resolve(session, abspath);

        if (!(yield vfs.access(session, node, "w"))) {
            throw new Error("Permission denied");
        }

        node.properties.ctime = new Date();
        node.properties.mode = octal(mode);

        yield db.updateOne("nodes", node);
    },
    chown: function*(session, abspath, username, group) {
        let node = yield vfs.resolve(session, abspath);

        if (!(yield vfs.access(session, node, "w"))) {
            throw new Error("Permission denied");
        }

        node.properties.ctime = new Date();
        node.properties.uid = yield vfs.uid(session, username);

        if (group) {
            node.properties.gid = yield vfs.gid(session, group);
        }

        yield db.updateOne("nodes", node);
    },
    setattributes: function*(session, abspath, attributes) {
        let node = yield vfs.resolve(session, abspath);

        if (!(yield vfs.access(session, node, "w"))) {
            throw new Error("Permission denied");
        }

        node.properties.mtime = new Date();

        for (let key of Object.keys(attributes)) {
            node.attributes[key] = attributes[key];
        }

        yield db.updateOne("nodes", node);
    },
    create: function*(session, abspath, type, attributes) {
        let parent = yield vfs.resolve(session, path.dirname(abspath));
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
                mode: octal(session.umask || "755"),
                birthtime: new Date(),
                ctime: new Date(),
                mtime: new Date(),
                uid: session.uid,
                gid: session.gid,
                children: [],
                count: 1
            },
            attributes: attributes || {}
        };

        if (type === "u") {
            node.attributes.password = sha1(name);
            node.properties.mode = octal("770");
        } else if (type === "g") {
            node.properties.mode = octal("770");
        } else if (type === "f") {
            if (!node.attributes._uploadId) {
                throw new Error("File must have an upload id attribute");
            }

            if (!node.attributes.filename) {
                throw new Error("File must have a filename attribute");
            }

            let ext = path.extname(node.attributes.filename);
            let uploadId = node.attributes._uploadId;
            delete node.attributes._uploadId;

            node.attributes.diskfilename = node._id + ext;
            node.attributes.mimetype = mime.lookup(ext);

            let sha1 = yield checksum.fileAsync(session.uploads[uploadId]);

            if (node.attributes.sha1 !== sha1) {
                throw new Error("Checksum does not match, upload failed");
            }

            let diskfilepath = path.join(params.fileDirectory, node.attributes.diskfilename);

            yield fs.moveAsync(session.uploads[uploadId], diskfilepath);
        }

        parent.properties.children.push({ id: node._id, name: name });

        yield db.insertOne("nodes", node);
        yield db.updateOne("nodes", parent);

        return node;
    },
    unlink: function*(session, abspath) {
        let parent = yield vfs.resolve(session, path.dirname(abspath));
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
        yield db.updateOne("nodes", parent);

        let rremove = co(function*(id) {
            let node = yield db.findOne("nodes", { _id: id });

            if (node.properties.count > 1) {
                node.properties.count--;

                yield db.updateOne("nodes", node);
            } else {
                yield db.removeOne("nodes", id);

                if (node.properties.type === "f") {
                    yield fs.removeAsync(path.join(params.fileDirectory, node.attributes.diskfilename));
                }

                let ids = node.properties.children.map((child) => child.id);
                for (let id of ids) {
                    yield rremove(id);
                }
            }
        });

        yield rremove(child.id);
    },
    link: function*(session, srcpath, destpath) {
        let srcparent = yield vfs.resolve(session, path.dirname(srcpath));
        let name = path.basename(srcpath);
        let child = srcparent.properties.children.filter((child) => child.name === name)[0];

        if (!child) {
            throw new Error(srcpath + " does not exists");
        }

        if (!(yield vfs.access(session, srcparent, "w"))) {
            throw new Error("Permission denied");
        }

        let destparent = yield vfs.resolve(session, path.dirname(destpath));
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

        if (!(yield vfs.access(session, destparent, "w"))) {
            throw new Error("Permission denied");
        }

        destparent.properties.children.push(child);
        destparent.properties.ctime = new Date();
        yield db.updateOne("nodes", destparent);

        let node = yield db.findOne("nodes", { _id: child.id });

        node.properties.count++;
        yield db.updateOne("nodes", node);
    },
    move: function*(session, srcpath, destpath) {
        let srcparent = yield vfs.resolve(session, path.dirname(srcpath));
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

        let destparent = yield vfs.resolve(session, path.dirname(destpath));
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
        yield db.updateOne("nodes", destparent);
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

        let destparent = yield vfs.resolve(session, path.dirname(destpath));
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

        let rcopy = co(function*(id) {
            let node = yield db.findOne("nodes", { _id: id });

            node._id = uuid.v4();
            node.properties.birthtime = new Date();
            node.properties.ctime = new Date();
            node.properties.mtime = new Date();
            node.properties.uid = session.uid;
            node.properties.gid = session.gid;
            node.properties.count = 1;
            node.properties.mode = octal(session.umask || "755");

            for (let child of node.properties.children) {
                child.id = yield rcopy(child.id);
            }

            if (node.properties.type === "f") {
                let olddiskfilepath = path.join(params.fileDirectory, node.attributes.diskfilename);
                let ext = path.extname(node.attributes.filename);

                node.attributes.diskfilename = node._id + ext;

                let newdiskfilepath = path.join(params.fileDirectory, node.attributes.diskfilename);

                yield fs.copyAsync(olddiskfilepath, newdiskfilepath);
            }

            yield db.insertOne("nodes", node);
            return node._id;
        });

        if (!(yield vfs.access(session, destparent, "w"))) {
            throw new Error("Permission denied");
        }

        child.id = yield rcopy(child.id);

        destparent.properties.children.push(child);
        yield db.updateOne("nodes", destparent);
    },
    allocateUploadId: function*(session) {
        return session.allocateUploadId();
    }
});

module.exports = vfs;
