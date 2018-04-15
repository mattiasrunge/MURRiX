"use strict";

const path = require("path");
const assert = require("assert");
const { v4: uuid } = require("uuid");
const shuffle = require("shuffle-array");
const { checkMode, MASKS } = require("./mode");
const { ADMIN_SESSION, isGuest } = require("./auth");
const { unpackObjectKeys } = require("./utils");
const bus = require("./bus");
const db = require("../../core/lib/db");

const Types = {};

class Node {
    constructor(data) {
        this.name = data.name;
        this.path = data.path;
        this._id = data._id;
        this.properties = { ...data.properties };
        this.attributes = { ...data.attributes };
        this.extra = data.extra || {};
    }


    // Static

    static register(name, Type) {
        return Types[name] = Type;
    }

    static async runDbMigration() {
        for (const name of Object.keys(Types)) {
            const nodes = await Node.query(ADMIN_SESSION, {
                "properties.type": name,
                $or: [
                    { "properties.version": { $exists: false } },
                    { "properties.version": { $lt: Types[name].VERSION } }
                ]
            }, { nolookup: true });

            for (const node of nodes) {
                await node._migrateDb(ADMIN_SESSION);
            }
        }
    }

    static getAttributeTypes() {
        return [
            {
                name: "name",
                label: "Name",
                type: "textline",
                required: true
            },
            {
                name: "description",
                label: "Description",
                type: "text"
            },
            {
                name: "labels",
                label: "Labels",
                type: "labels"
            }
        ];
    }

    static getType(name) {
        if (!Types[name]) {
            throw new Error(`No type named ${name}`);
        }

        return Types[name];
    }

    static _factory(name, data) {
        const Type = this.getType(name);

        return new Type(data);
    }

    static async _instantiate(session, id, abspath, name) {
        const query = id ? { _id: id } : { "properties.type": "r" };
        const node = await db.findOne("nodes", query);

        assert(node, `No node found (id: ${id}, abspath: ${abspath}, name: ${name})`);

        return this._factory(node.properties.type, {
            ...node,
            name: name || null,
            path: abspath
        });
    }

    static async _createData(session, parent, type, attributes = {}) {
        return {
            _id: uuid(),
            properties: {
                type,
                mode: session.umask ? session.umask : parent.properties.mode,
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
                count: 0
            },
            attributes: {
                labels: [],
                ...attributes
            }
        };
    }

    static async _ensureIndexes() {
        const indexes = [
            "properties.type",
            "properties.birthtime",
            "properties.children.name",
            "properties.children.id",
            "attributes.name",
            "attributes.time.timestamp",
            "attributes.path"
        ].map((index) => ({ key: { [index]: 1 } }));

        return db.createIndexes("nodes", indexes);
    }

    static async exists(session, abspath, options) {
        try {
            await this.resolve(session, abspath, options);

            return true;
        } catch (error) {
        }

        return false;
    }

    static async resolve(session, abspath, options = {}) {
        if (typeof abspath === "undefined") {
            throw new Error("Resolve can not be called without abspath set");
        } else if (typeof abspath === "object") {
            return abspath;
        } else if (typeof abspath !== "string") {
            throw new Error(`Resolve can not be called with abspath of type ${typeof abspath}, value was: ${abspath}`);
        } else if (abspath[0] !== "/") {
            const list = await this.lookup(session, abspath);

            assert(list[0], `Not found (id: ${abspath})`);

            return list[0];
        }

        const parts = abspath.replace(/\/$/g, "").split("/");
        parts.shift();

        let currentpath = "/";
        let nodepath = await this._instantiate(session, null, currentpath);

        while (parts.length > 0) {
            const name = parts.shift();

            await nodepath.assertAccess(session, "x");

            const child = nodepath.properties.children.find((child) => child.name === name);

            currentpath = path.join(currentpath, name);

            assert(child, `Path not found (abspath: ${abspath}, parts: ${parts.join(":")}, current: ${currentpath})`);

            nodepath = await this._instantiate(session, child.id, currentpath, child.name);

            const readlink = options.nofollow || (options.readlink && parts.length === 0);
            nodepath = await nodepath.get(session, { readlink });

            await nodepath.assertAccess(session, "r");
        }

        return nodepath;
    }

    static async list(session, abspath, options = {}) {
        const pathInfo = this._parsePath(abspath);
        const parent = await this.resolve(session, pathInfo.abspath);

        if (!parent) {
            return [];
        }

        return parent.children(session, {
            query: options.query,
            pattern: options.pattern,
            search: options.search,
            skip: options.skip,
            limit: options.limit,
            nofollow: options.nofollow,
            sort: options.sort,
            reverse: options.reverse,
            opts: options.opts
        });
    }

    static async query(session, query, options = {}) {
        const dbOpts = {
            limit: options.limit,
            sort: options.sort,
            skip: options.skip
        };

        if (options.nolookup) {
            const nodes = await db.find("nodes", query, dbOpts);

            return nodes.map((node) => this._factory(node.properties.type, {
                ...node,
                name: null,
                path: null
            }));
        }

        const nodes = await db.find("nodes", query, {
            ...dbOpts,
            fields: [ "_id" ]
        });
        const results = [];

        for (const node of nodes) {
            const list = await Node.lookup(session, node._id);

            results.push(...list);
        }

        return results;
    }

    static async lookup(session, id) {
        const pipeline = [
            {
                $match: { _id: id }
            },
            {
                $graphLookup: {
                    from: "nodes",
                    startWith: "$_id",
                    connectFromField: "_id",
                    connectToField: "properties.children.id",
                    as: "parents"
                }
            }
        ];

        const cursor = await this.aggregate(session, pipeline);
        const nodes = await cursor.toArray();

        const getParentInfo = (parents, id) => {
            const list = [];

            for (const parent of parents) {
                const children = parent.properties.children.filter((child) => child.id === id);

                if (children.length > 0) {
                    const paths = getParentInfo(parents, parent._id);

                    for (const path of paths) {
                        for (const child of children) {
                            list.push(`${path}/${child.name}`);
                        }
                    }
                }
            }

            return list.length === 0 ? [ "" ] : list;
        };

        const list = [];

        nodes.forEach((node) => {
            const paths = getParentInfo(node.parents, node._id);

            delete node.parents;

            for (const abspath of paths) {
                list.push(this._factory(node.properties.type, {
                    ...node,
                    name: path.basename(abspath) || null,
                    path: abspath
                }));
            }
        });

        return list.filter((node) => node.hasAccess(session, "r"));
    }

    static async aggregate(session, pipeline) {
        return db.aggregate("nodes", pipeline);
    }

    static async labels(session) {
        assert(session.username, "Permission denied");
        assert(!isGuest(session), "Permission denied");

        const labels = await this.aggregate(session, [
            {
                $unwind: "$attributes.labels"
            },
            {
                $group: {
                    _id: "$attributes.labels",
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $addFields: {
                    name: "$_id",
                    count: "$count"
                }
            },
            {
                $match: {
                    name: { $ne: "" }
                }
            },
            {
                $sort: {
                    count: -1
                }
            },
            {
                $project: { _id: 0 }
            }
        ]);

        return labels.toArray();
    }


    // Private

    static _parsePath(abspath) {
        let pattern = false;

        if (typeof abspath === "string") {
            abspath = abspath.replace(/\/$/, "");
            const slashIndex = abspath.lastIndexOf("/");
            const lastPart = abspath.substr(slashIndex + 1);

            pattern = lastPart.includes("*") ? lastPart.replace("*", ".*?") : false;
            abspath = pattern ? abspath.substr(0, slashIndex) : abspath;
            abspath = abspath === "" ? "/" : abspath;
        }

        return {
            abspath,
            pattern
        };
    }

    async _notify(session, method) {
        return bus.emit(`node.${method}`, {
            uid: session.uid,
            node: this
        });
    }

    _serializeForDb() {
        return {
            _id: this._id,
            properties: { ...this.properties },
            attributes: { ...this.attributes }
        };
    }

    async _migrateDb() {
        this.properties.version = this.constructor.VERSION;

        await db.updateOne("nodes", this._serializeForDb());
    }

    async _doRecursive(session, method, ...args) {
        const children = await this.children(session, { nofollow: true });

        for (const child of children) {
            await child[method](session, ...args);
        }
    }

    async _props(session, properties) {
        const props = {
            ...this.properties,
            ...properties,
            ctime: new Date(),
            cuid: session.uid
        };

        Object.keys(properties)
        .filter((key) => properties[key] === null)
        .forEach((key) => delete props[key]);

        this.properties = props;

        await db.updateOne("nodes", this._serializeForDb());
    }

    async _attr(session, attributes) {
        const props = {
            ...this.properties,
            ctime: new Date(),
            mtime: new Date(),
            cuid: session.uid,
            muid: session.uid
        };

        const attr = {
            ...this.attributes,
            ...attributes
        };

        Object.keys(attributes)
        .filter((key) => attributes[key] === null)
        .forEach((key) => delete attr[key]);

        this.attributes = attr;
        this.properties = props;

        await db.updateOne("nodes", this._serializeForDb());
    }

    async _postCreate(/* session */) {
        // Can be overridden to create more sub structure for specific types
    }


    // Getters

    async serialize(session) {
        return {
            name: this.name,
            path: this.path,
            _id: this._id,
            attributes: this.attributes,
            properties: this.properties,
            editable: await this.hasAccess(session, "w"),
            extra: this.extra
        };
    }

    async get(/* session, options = {} */) {
        return this;
    }

    async hasAccess(session, level) {
        assert(session.username, "Corrupt session, please reinitialize");

        if (session.almighty || session.username === "admin" || session.admin) {
            return true;
        }

        const mode = this.properties.mode;

        if (this.properties.uid === session.uid && checkMode(mode, level, MASKS.OWNER)) {
            return true;
        } else if (session.gids.includes(this.properties.gid) && checkMode(mode, level, MASKS.GROUP)) {
            return true;
        } else if (checkMode(mode, level, MASKS.OTHER)) {
            return true;
        }

        if (this.properties.acl && this.properties.acl.length > 0) {
            for (const ac of this.properties.acl) {
                const validAcl = (ac.uid && ac.uid === session.uid) || (ac.gid && session.gids.includes(ac.gid));

                if (validAcl && checkMode(mode, level, MASKS.ACL)) {
                    return true;
                }
            }
        }

        return false;
    }

    async assertAccess(session, level) {
        assert(await this.hasAccess(session, level), "Permission denied");
    }

    async children(session, options = {}) {
        let children = this.properties.children;

        if (options.pattern) {
            const expr = new RegExp(`^${options.pattern}$`, "i");
            children = children.filter((child) => child.name.match(expr));
        }

        const ids = children.map((child) => child.id);
        const query = Object.assign({}, options.query || {}, { _id: { $in: ids } });
        const nodes = await db.find("nodes", query, options.opts);

        const promises = children
        .map((child) => ({
            node: nodes.find((node) => node._id === child.id),
            name: child.name,
            path: path.join(this.path, child.name)
        }))
        .filter((nodepath) => nodepath.node)
        .map((nodepath) => this.constructor._factory(nodepath.node.properties.type, {
            ...nodepath.node,
            name: nodepath.name,
            path: nodepath.path
        }))
        .map((item) => item.get(session, { readlink: options.nofollow }));

        let list = (await Promise.all(promises))
        .filter((item) => item.hasAccess(session, "r"));

        if (options.search) {
            const expr = new RegExp(options.search, "i");
            list = list.filter((child) => child.attributes.name.match(expr));
        }

        if (options.sort === "time") {
            list.sort((a, b) => {
                if (!a.attributes.time) {
                    return a.name.localeCompare(b.name);
                } else if (!b.attributes.time) {
                    return b.name.localeCompare(a.name);
                }

                return a.attributes.time.timestamp - b.attributes.time.timestamp;
            });
        } else if (options.sort === "shuffle") {
            list = shuffle(list);
        } else {
            list.sort((a, b) => a.name.localeCompare(b.name));
        }

        if (options.reverse) {
            list.reverse();
        }

        if (options.limit) {
            list = list.slice(options.skip || 0, options.limit);
        }

        return list;
    }


    // Setters

    async setfacl(session, ac, options = {}) {
        await this.assertAccess(session, "w");

        let acl = [];

        if (ac) {
            acl = this.properties.acl
            .filter((item) => item.uid !== ac.uid || item.gid !== ac.gid);

            (ac.mode > 0) && acl.push({
                gid: ac.gid,
                uid: ac.uid,
                mode: ac.mode
            });
        }

        await this._props(session, { acl });

        await this._notify(session, "setfacl");
        await this._notify(session, "update");

        options.recursive && await this._doRecursive(session, "setfacl", ac, options);
    }

    async chmod(session, mode, options = {}) {
        await this.assertAccess(session, "w");

        await this._props(session, { mode });

        await this._notify(session, "chmod");
        await this._notify(session, "update");

        options.recursive && await this._doRecursive(session, "chmod", mode, options);
    }

    async chown(session, uid, gid, options = {}) {
        await this.assertAccess(session, "w");

        const properties = {};

        uid && (properties.uid = uid);
        gid && (properties.gid = gid);

        await this._props(session, properties);

        await this._notify(session, "chown");
        await this._notify(session, "update");

        options.recursive && await this._doRecursive(session, "chown", uid, gid, options);
    }

    async update(session, attributes) {
        await this.assertAccess(session, "w");

        await this._attr(session, unpackObjectKeys(attributes));

        await this._notify(session, "update");
    }

    async remove(session) {
        if (this.properties.count > 0) {
            return;
        }

        const children = await this.children(session, { nofollow: true });

        for (const child of children) {
            await this.removeChild(session, child);
            await child.remove(session);
        }

        await db.removeOne("nodes", this._id);

        await this._notify(session, "remove");
    }

    async removeChild(session, child) {
        await this.assertAccess(session, "w");
        assert(this.properties.children.some((c) => c.id === child._id && c.name === child.name), `Not a child to this node, this (${JSON.stringify(this.properties.children)}), child (${child.name}:${child._id})`);

        await child._props(session, { count: child.properties.count - 1 });

        const children = this.properties.children
        .filter((c) => c.id !== child._id || c.name !== child.name);

        await this._props(session, { children });

        await this._notify(session, "removeChild");
    }

    async appendChild(session, child) {
        await this.assertAccess(session, "w");
        assert(this.properties.children.every((c) => c.id !== child._id || c.name !== child.name), "Already a child to this node");

        await child._props(session, { count: child.properties.count + 1 });

        const children = this.properties.children.slice(0);

        children.push({
            id: child._id,
            name: child.name
        });

        await this._props(session, { children });

        await this._notify(session, "appendChild");
    }

    async appendChildCopy(session, child) {
        const copy = await this.createChild({ ...session, umask: child.properties.mode }, child.properties.type, child.name, child.attributes);

        await this.appendChild(session, copy);

        const children = await child.children(session);

        for (const child of children) {
            await copy.appendChildCopy(session, child);
        }
    }

    async createChild(session, type, name, attributes = {}) {
        const exists = this.properties.children.some((child) => child.name === name);
        const abspath = path.join(this.path, name);

        assert(!exists, `${abspath} already exists`);
        await this.assertAccess(session, "w");
        assert(Types[type], `No type named ${type}`);

        const node = await Types[type]._createData(session, this, type, unpackObjectKeys(attributes));
        const nodepath = Node._factory(node.properties.type, {
            ...node,
            name,
            path: abspath
        });

        await db.insertOne("nodes", nodepath._serializeForDb());
        await nodepath.constructor._ensureIndexes();

        await nodepath._notify(session, "create");

        await this.appendChild(session, nodepath);

        await nodepath._postCreate(session);

        return nodepath;
    }

    async getChild(session, name) {
        const children = await this.children(session, { pattern: name });

        return children[0];
    }

    async getUniqueChildName(session, name) {
        const names = this.properties.children.map((child) => child.name);
        const escapedName = name.replace(/ |\//g, "_");

        let result = escapedName;
        let counter = 1;

        while (names.includes(result)) {
            result = `${escapedName}_${counter}`;
            counter++;
        }

        return result;
    }
}

module.exports = Node;
