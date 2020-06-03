"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs-extra");
const { FileSystemInterface, PermissionDeniedError, NoSuchFileError } = require("sftp-fs");
const utils = require("./utils");
const Client = require("../terminal/client");
const configuration = require("../lib/configuration");
const { api } = require("../api");

class FileSystem extends FileSystemInterface {
    async authenticate(session, request) {
        session.client = new Client(session);

        try {
            assert(request.method === "password");
            await api.login(session.client, request.username, request.password);
        } catch {
            throw new PermissionDeniedError();
        }
    }

    async opendir(session, handle) {
        handle.setParam("eof", false);
    }

    async open(session, handle, flags) {
        const client = session.client;
        const { abspath, what } = utils.transformPath(handle.pathname);
        const level = utils.flags2level(flags);
        let node;

        try {
            node = await api.resolve(client, abspath);
        } catch {
            throw new NoSuchFileError();
        }

        try {
            assert(await api.access(client, abspath, level));
            assert(what !== "properties" || level === "r");
        } catch {
            throw new PermissionDeniedError();
        }

        handle.setParam("what", what);
        handle.setParam("flags", flags);

        if (what === "file") {
            if (node.properties.type !== "f") {
                throw new PermissionDeniedError();
            }

            const filename = path.join(configuration.fileDirectory, node.attributes.diskfilename);
            const file = await fs.open(filename, utils.flags2mode(flags));

            handle.setParam("file", file);
            handle.setParam("filename", filename);
            handle.addDisposable(async () => fs.close(file));
        } else {
            const action = utils.flags2write(flags);

            if (action === "truncate") {
                handle.setParam("buffer", Buffer.alloc(0));
            } else {
                handle.setParam("buffer", Buffer.from(JSON.stringify(node[what], null, 2)));
            }

            handle.addDisposable(async () => {
                if (what === "attributes") {
                    const current = Buffer.from(JSON.stringify(node[what], null, 2));

                    if (current.compare(handle.getParam("buffer")) !== 0) {
                        await api.update(client, abspath, JSON.parse(handle.getParam("buffer").toString()));
                    }
                }
            });
        }
    }

    async stat(session, pathname, options) {
        const client = session.client;
        const { abspath, what } = utils.transformPath(pathname);

        const node = await api.resolve(client, abspath, options);
        let size = 0;
        let mode = node.properties.mode;

        if (what === "file") {
            size = node.attributes.size;
            mode |= fs.constants.S_IFREG;
        } else if (what === "files") {
            mode |= fs.constants.S_IFDIR;
            mode &= ~fs.constants.S_IWUSR;
            mode |= fs.constants.S_IXUSR;
            mode &= ~fs.constants.S_IWGRP;
            mode |= fs.constants.S_IXGRP;
            mode &= ~fs.constants.S_IWOTH;
            mode |= fs.constants.S_IXOTH;
        } else if (what === "attributes") {
            size = JSON.stringify(node.attributes, null, 2).length;
            mode |= fs.constants.S_IFREG;
            mode &= ~fs.constants.S_IXUSR;
            mode &= ~fs.constants.S_IXGRP;
            mode &= ~fs.constants.S_IXOTH;
        } else if (what === "properties") {
            size = JSON.stringify(node.properties, null, 2).length;
            mode |= fs.constants.S_IFREG;
            mode &= ~fs.constants.S_IWUSR;
            mode &= ~fs.constants.S_IXUSR;
            mode &= ~fs.constants.S_IWGRP;
            mode &= ~fs.constants.S_IXGRP;
            mode &= ~fs.constants.S_IWOTH;
            mode &= ~fs.constants.S_IXOTH;
        } else if (node.properties.type === "s") {
            mode |= fs.constants.S_IFLNK;
        } else {
            mode |= fs.constants.S_IFDIR;
        }

        return {
            mode: mode,
            uid: node.properties.uid,
            gid: node.properties.uid,
            size: size,
            mtime: node.properties.mtime,
            ctime: node.properties.ctime,
            isDirectory: () => (mode & fs.constants.S_IFDIR) > 0,
            isFile: () => (mode & fs.constants.S_IFREG) > 0,
            isBlockDevice: () => false,
            isCharacterDevice: () => false,
            isSymbolicLink: () => node.properties.type === "s",
            isFIFO: () => false,
            isSocket: () => false
        };
    }

    async lstat(session, pathname) {
        return this.stat(session, pathname, { readlink: true });
    }

    async write(session, handle, offset, data) {
        const what = handle.getParam("what");

        if (what === "file") {
            const file = handle.getParam("file");
            await fs.write(file, data, offset);
        } else {
            let buffer = handle.getParam("buffer");

            if (offset + data.length > buffer.length) {
                const newBuffer = Buffer.alloc(offset + data.length);
                buffer.copy(newBuffer);

                buffer = newBuffer;
                handle.setParam("buffer", buffer);
            }

            buffer.write(data.toString(), offset, data.length);
        }
    }

    async read(session, handle, offset, length) {
        const what = handle.getParam("what");

        if (what === "file") {
            const filename = handle.getParam("filename");
            const file = handle.getParam("file");
            const attrs = await fs.stat(filename);

            if (offset >= attrs.size) {
                return;
            }

            const buffer = Buffer.alloc(length);
            const { bytesRead } = await fs.read(file, buffer, 0, length, offset);

            return buffer.slice(0, bytesRead);
        }

        const buffer = handle.getParam("buffer");

        if (offset >= buffer.length) {
            return;
        }

        return buffer.slice(offset, offset + length);
    }

    async listdir(session, handle) {
        const client = session.client;

        if (handle.getParam("eof")) {
            return;
        }

        const { abspath, what } = utils.transformPath(handle.pathname);

        const result = [];

        if (what === "files") {
            const nodes = await api.list(client, abspath, { query: { "properties.type": "f" } });

            for (const node of nodes) {
                const filename = node.name;
                const attrs = await this.lstat(session, path.join(node.path, `$${filename}`));
                const num = 1; // TODO: Number of links and directories inside this directory

                result.push({
                    filename,
                    longname: utils.longname(filename, attrs, num),
                    attrs
                });
            }
        } else {
            const node = await api.resolve(client, abspath);

            let filename;
            let attrs;
            const num = 1; // TODO: Number of links and directories inside this directory

            filename = "$attributes.json";
            attrs = await this.stat(session, path.join(abspath, filename));
            result.push({
                filename,
                longname: utils.longname(filename, attrs, num),
                attrs
            });

            filename = "$properties.json";
            attrs = await this.lstat(session, path.join(abspath, filename));
            result.push({
                filename,
                longname: utils.longname(filename, attrs, num),
                attrs
            });

            const childfiles = await api.list(client, abspath, { query: { "properties.type": "f" } });
            if (childfiles.length > 0) {
                filename = "$files";
                attrs = await this.lstat(session, path.join(abspath, filename));
                result.push({
                    filename,
                    longname: utils.longname(filename, attrs, num),
                    attrs
                });
            }

            if (node.properties.type === "f") {
                filename = `$${node.name}`;
                attrs = await this.lstat(session, path.join(abspath, filename));
                result.push({
                    filename,
                    longname: utils.longname(filename, attrs, num),
                    attrs
                });
            }

            for (const child of node.properties.children) {
                try {
                    filename = child.name;
                    attrs = await this.lstat(session, path.join(abspath, filename));

                    result.push({
                        filename,
                        longname: utils.longname(filename, attrs, num),
                        attrs
                    });
                } catch {}
            }
        }

        handle.setParam("eof", true);

        return result;
    }

    // async mkdir(session, pathname, attrs) {
    //     const client = session.client;
    //     await fs.mkdir(pathname, attrs.mode & ~fs.constants.S_IFMT);
    //     await this.setstat(pathname, {
    //         uid: attrs.uid,
    //         gid: attrs.gid,
    //         atime: attrs.atime,
    //         mtime: attrs.mtime
    //     });
    // }
    //
    // async setstat(session, pathname, attrs) {
    //     const client = session.client;
    //     if (isset(attrs.mode)) {
    //         await fs.chmod(pathname, attrs.mode);
    //     }
    //
    //     if (isset(attrs.uid) || isset(attrs.gid)) {
    //         await fs.chown(pathname, attrs.uid, attrs.gid);
    //     }
    //
    //     if (isset(attrs.atime) || isset(attrs.mtime)) {
    //         await fs.utimes(pathname, attrs.atime, attrs.mtime);
    //     }
    // }
    //
    // async rename(session, oldPathname, newPathname) {
    //     const client = session.client;
    //     await fs.rename(oldPathname, newPathname);
    // }
    //
    // async rmdir(session, pathname) {
    //     const client = session.client;
    //     await fs.rmdir(pathname);
    // }
    //
    // async remove(session, pathname) {
    //     const client = session.client;
    //     await fs.unlink(pathname);
    // }

    async realpath(session, pathname) {
        const client = session.client;
        const { abspath } = utils.transformPath(pathname);
        const node = await api.resolve(client, abspath);

        return node.path;
    }

    async readlink(session, pathname) {
        const client = session.client;
        const { abspath } = utils.transformPath(pathname);
        const node = await api.resolve(client, abspath, { readlink: true });

        assert(node.properties.type === "s");

        return node.attributes.path;
    }

    // async symlink(session, targetPathname, linkPathname) {
    //     const client = session.client;
    //     return await fs.symlink(targetPathname, linkPathname);
    // }
}

module.exports = FileSystem;
