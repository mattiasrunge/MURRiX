"use strict";

const path = require("path");
const assert = require("assert");
const { v4: uuid } = require("uuid");
const shuffle = require("shuffle-array");
const { checkMode, MASKS } = require("./mode");
const { unpackObjectKeys } = require("./utils");
const bus = require("../bus");
const db = require("../db");

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

    static getActionTypes() {
        // TODO: Should we add remove here?
        return [];
    }

    static getType(name) {
        if (!Types[name]) {
            throw new Error(`No type named ${name}`);
        }

        return Types[name];
    }

    static getTypes(filtered) {
        if (filtered) {
            const restricted = new Set([ "r", "s", "g", "u" ]);

            return Object
            .keys(Types)
            .filter((type) => !restricted.has(type));
        }

        return Object.keys(Types);
    }

    static _factory(name, data) {
        const Type = this.getType(name);

        return new Type(data);
    }

    static async _instantiate(client, id, abspath, name) {
        const query = id ? { _id: id } : { "properties.type": "r" };
        const node = await db.findOne("nodes", query);

        assert(node, `No node found (id: ${id}, abspath: ${abspath}, name: ${name})`);

        return this._factory(node.properties.type, {
            ...node,
            name: name || null,
            path: abspath
        });
    }

    static async _createData(client, parent, type, attributes = {}) {
        return {
            _id: uuid(),
            properties: {
                type,
                mode: client.getUmask() ? client.getUmask() : parent.properties.mode,
                birthtime: new Date(),
                birthuid: client.getUid(),
                ctime: new Date(),
                cuid: client.getUid(),
                mtime: new Date(),
                muid: client.getUid(),
                uid: client.getUid(),
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

    static async exists(client, abspath, options) {
        try {
            await this.resolve(client, abspath, options);

            return true;
        } catch {}

        return false;
    }

    static async resolve(client, abspath, options = {}) {
        if (typeof abspath === "undefined") {
            throw new TypeError("Resolve can not be called without abspath set");
        } else if (typeof abspath === "object") {
            return abspath;
        } else if (typeof abspath !== "string") {
            throw new TypeError(`Resolve can not be called with abspath of type ${typeof abspath}, value was: ${abspath}`);
        } else if (abspath[0] !== "/") {
            const list = await this.lookup(client, abspath);

            assert(list[0], `Not found (id: ${abspath})`);

            return list[0];
        }

        abspath = path.normalize(abspath);

        const parts = abspath.replace(/\/$/g, "").split("/");
        parts.shift();

        let currentpath = "/";
        let nodepath = await this._instantiate(client, null, currentpath);

        while (parts.length > 0) {
            const name = parts.shift();

            await nodepath.assertAccess(client, "x");

            const child = nodepath.properties.children.find((child) => child.name === name);

            currentpath = path.join(currentpath, name);

            assert(child, `${abspath}: Path not found`);

            nodepath = await this._instantiate(client, child.id, currentpath, child.name);

            const readlink = options.nofollow || (options.readlink && parts.length === 0);
            nodepath = await nodepath.get(client, { readlink });
        }

        await nodepath.assertAccess(client, "r");

        return nodepath;
    }

    static async list(client, abspath, options = {}) {
        const pathInfo = this._parsePath(abspath);
        const parent = await this.resolve(client, pathInfo.abspath);

        if (!parent) {
            return [];
        }

        return parent.children(client, {
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

    static async count(client, query, options = {}) {
        return await db.countDocuments("nodes", query, options);
    }

    static async query(client, query, options = {}) {
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
            projection: [ "_id" ]
        });
        const results = [];

        for (const node of nodes) {
            const list = await Node.lookup(client, node._id);

            results.push(...list);
        }

        return results;
    }

    static async lookup(client, id) {
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

        const cursor = await this.aggregate(client, pipeline);
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

        const result = [];

        for (const node of list) {
            if (await node.hasAccess(client, "r")) {
                result.push(node);
            }
        }

        return result;
    }

    static async aggregate(client, pipeline) {
        return db.aggregate("nodes", pipeline);
    }

    static async labels(client) {
        assert(!client.isGuest(), "Permission denied");

        const labels = await this.aggregate(client, [
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
            const lastPart = abspath.slice(slashIndex + 1);

            pattern = lastPart.includes("*") ? lastPart.replace("*", ".*?") : false;
            abspath = pattern ? abspath.slice(0, Math.max(0, slashIndex)) : abspath;
            abspath = abspath === "" ? "/" : abspath;
        }

        return {
            abspath,
            pattern
        };
    }

    async _notify(client, method) {
        return bus.emit(`node.${method}`, {
            uid: client.getUid(),
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

    async _doRecursive(client, method, ...args) {
        const children = await this.children(client, { nofollow: true });

        for (const child of children) {
            await child[method](client, ...args);
        }
    }

    async _props(client, properties) {
        const props = {
            ...this.properties,
            ...properties,
            ctime: new Date(),
            cuid: client.getUid()
        };

        Object.keys(properties)
        .filter((key) => properties[key] === null)
        .forEach((key) => delete props[key]);

        this.properties = props;

        const serialized = this._serializeForDb();

        await db.updateOne("nodes", serialized);
        await db.history.store(this._id, serialized, client.getUsername());
    }

    async _attr(client, attributes) {
        const props = {
            ...this.properties,
            ctime: new Date(),
            mtime: new Date(),
            cuid: client.getUid(),
            muid: client.getUid()
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

        const serialized = this._serializeForDb();

        await db.updateOne("nodes", serialized);
        await db.history.store(serialized._id, serialized, client.getUsername());
    }

    async _postCreate(/* client */) {
        // Can be overridden to create more sub structure for specific types
    }


    // Getters

    async serialize(client) {
        return {
            name: this.name,
            path: this.path,
            _id: this._id,
            attributes: this.attributes,
            properties: this.properties,
            editable: await this.hasAccess(client, "w"),
            extra: this.extra
        };
    }

    async get(/* client, options = {} */) {
        return this;
    }

    async hasAccess(client, level) {
        assert(client.getUsername(), "Corrupt user information in session, please reinitialize");

        if (client.isAdmin()) {
            return true;
        }

        const mode = this.properties.mode;

        if (this.properties.uid === client.getUid() && checkMode(mode, level, MASKS.OWNER)) {
            return true;
        }

        if ((client.getGids().includes(this.properties.gid) && checkMode(mode, level, MASKS.GROUP))) {
            return true;
        }

        if (checkMode(mode, level, MASKS.OTHER)) {
            return true;
        }

        if (this.properties.acl && this.properties.acl.length > 0) {
            for (const ac of this.properties.acl) {
                const validAcl = (ac.uid && ac.uid === client.getUid()) || (ac.gid && client.getGids().includes(ac.gid));

                if (validAcl && checkMode(ac.mode, level, MASKS.ACL)) {
                    return true;
                }
            }
        }

        return false;
    }

    async assertAccess(client, level) {
        assert(await this.hasAccess(client, level), "Permission denied");
    }

    async children(client, options = {}) {
        let children = this.properties.children;

        if (options.pattern) {
            const expr = new RegExp(`^${options.pattern}$`, "i");
            children = children.filter(({ name }) => expr.test(name));
        }

        const ids = children.map(({ id }) => id);
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
        .map((item) => item.get(client, { readlink: options.nofollow }));

        let list = (await Promise.all(promises))
        .filter((item) => item.hasAccess(client, "r"));

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

    async cloneAccess(client, template, options = {}) {
        await this.assertAccess(client, "w");

        await this._props(client, {
            acl: template.properties.acl,
            mode: template.properties.mode,
            gid: template.properties.gid,
            uid: template.properties.uid
        });

        await this._notify(client, "cloneAccess");
        await this._notify(client, "update");

        options.recursive && await this._doRecursive(client, "cloneAccess", template, options);
    }

    async setfacl(client, ac, options = {}) {
        await this.assertAccess(client, "w");

        let acl = [];

        if (ac) {
            acl = this.properties.acl.slice(0).filter((item) => item.uid !== (ac.uid || null) || item.gid !== (ac.gid || null));

            if (ac.mode > 0) {
                acl.push({
                    gid: (ac.gid || null),
                    uid: (ac.uid || null),
                    mode: ac.mode
                });
            }
        }

        await this._props(client, { acl });

        await this._notify(client, "setfacl");
        await this._notify(client, "update");

        options.recursive && await this._doRecursive(client, "setfacl", ac, options);
    }

    async chmod(client, mode, options = {}) {
        await this.assertAccess(client, "w");

        await this._props(client, { mode });

        await this._notify(client, "chmod");
        await this._notify(client, "update");

        options.recursive && await this._doRecursive(client, "chmod", mode, options);
    }

    async chown(client, uid, gid, options = {}) {
        await this.assertAccess(client, "w");

        const properties = {};

        uid && (properties.uid = uid);
        gid && (properties.gid = gid);

        await this._props(client, properties);

        await this._notify(client, "chown");
        await this._notify(client, "update");

        options.recursive && await this._doRecursive(client, "chown", uid, gid, options);
    }

    async setGroup(client, groupId) {
        await this.assertAccess(client, "w");

        const properties = {
            group: groupId ?? null
        };

        await this._props(client, properties);

        await this._notify(client, "setgroup");
        await this._notify(client, "update");
    }

    async update(client, attributes, quiet = false) {
        await this.assertAccess(client, "w");

        await this._attr(client, unpackObjectKeys(attributes));

        if (!quiet) {
            await this._notify(client, "update");
        }
    }

    async remove(client) {
        if (this.properties.count > 0) {
            return;
        }

        const children = await this.children(client, { nofollow: true });

        for (const child of children) {
            await this.removeChild(client, child);
            await child.remove(client);
        }

        await db.removeOne("nodes", this._id);
        await db.history.remove(this._id, client.getUsername());

        await this._notify(client, "remove");
    }

    async removeChild(client, child) {
        await this.assertAccess(client, "w");
        assert(this.properties.children.some((c) => c.id === child._id && c.name === child.name), `Not a child to this node, this (${JSON.stringify(this.properties.children)}), child (${child.name}:${child._id})`);

        await child._props(client, { count: child.properties.count - 1 });

        const children = this.properties.children
        .filter((c) => c.id !== child._id || c.name !== child.name);

        await this._props(client, { children });

        await this._notify(client, "removeChild");
    }

    async appendChild(client, child) {
        await this.assertAccess(client, "w");
        assert(this.properties.children.every((c) => c.id !== child._id || c.name !== child.name), "Already a child to this node");

        await child._props(client, { count: child.properties.count + 1 });

        const children = this.properties.children.slice(0);

        children.push({
            id: child._id,
            name: child.name
        });

        await this._props(client, { children });

        await this._notify(client, "appendChild");
    }

    async appendChildCopy(client, child) {
        const newClient = client.clone({
            umask: child.properties.mode
        });
        const copy = await this.createChild(newClient, child.properties.type, child.name, child.attributes);

        const children = await child.children(client);

        for (const child of children) {
            await copy.appendChildCopy(client, child);
        }
    }

    async createChild(client, type, name, attributes = {}) {
        assert(name[0] !== "$", "Node name is not allowed to start with $");

        const exists = this.properties.children.some((child) => child.name === name);
        const abspath = path.join(this.path, name);

        assert(!exists, `${abspath} already exists`);
        await this.assertAccess(client, "w");
        assert(Types[type], `No type named ${type}`);

        const node = await Types[type]._createData(client, this, type, unpackObjectKeys(attributes));
        const nodepath = Node._factory(node.properties.type, {
            ...node,
            name,
            path: abspath
        });

        const serialized = nodepath._serializeForDb();

        await db.insertOne("nodes", serialized);
        await db.history.store(serialized._id, serialized, client.getUsername());
        await nodepath.constructor._ensureIndexes();

        await nodepath._notify(client, "create");

        await this.appendChild(client, nodepath);

        await nodepath._postCreate(client);

        return nodepath;
    }

    async getChild(client, name) {
        const children = await this.children(client, { pattern: name });

        return children[0];
    }

    async revisions(client) {
        await this.assertAccess(client, "r");

        return await db.history.revisions(this._id);
    }

    async revision(client, rev) {
        await this.assertAccess(client, "r");

        return await db.history.fetch(this._id, rev);
    }

    async getUniqueChildName(client, name) {
        const names = new Set(this.properties.children.map((child) => child.name));
        const escapedName = name.trim().replace(/ |\//g, "_").replace(/\?/g, "");

        let result = escapedName;
        let counter = 1;

        while (names.has(result)) {
            result = `${escapedName}_${counter}`;
            counter++;

            // Catch for if counter overflows, should probably never happen in the real world but to be safe
            assert(counter > 0, "Could not generate a unique child name, counter overflowed");
        }

        return result;
    }
}

module.exports = Node;
