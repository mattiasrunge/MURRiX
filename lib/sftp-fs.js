"use strict";

const assert = require("assert");
const path = require("path");
const { promises: fs, constants } = require("fs");
const { SFTP_OPEN_MODE } = require("ssh2");
const { FileSystemInterface, PermissionDeniedError, NoSuchFileError } = require("sftp-fs");
const configuration = require("./configuration");
const login = require("../vfs/commands/login");
const resolve = require("../vfs/commands/resolve");
const update = require("../vfs/commands/update");
const list = require("../vfs/commands/list");
const access = require("../vfs/commands/access");

const longname = (name, attrs, num) => {
    let str = "-";

    if (attrs.isDirectory()) {
        str = "d";
    } else if (attrs.isSymbolicLink()) {
        str = "l";
    }

    str += (attrs.mode & constants.S_IRUSR) ? "r" : "-";
    str += (attrs.mode & constants.S_IWUSR) ? "w" : "-";
    str += (attrs.mode & constants.S_IXUSR) ? "x" : "-";
    str += (attrs.mode & constants.S_IRGRP) ? "r" : "-";
    str += (attrs.mode & constants.S_IWGRP) ? "w" : "-";
    str += (attrs.mode & constants.S_IXGRP) ? "x" : "-";
    str += (attrs.mode & constants.S_IROTH) ? "r" : "-";
    str += (attrs.mode & constants.S_IWOTH) ? "w" : "-";
    str += (attrs.mode & constants.S_IXOTH) ? "x" : "-";
    str += num.toString().padStart(5);
    str += " ";
    str += attrs.uid;
    str += "  ";
    str += attrs.gid;
    str += attrs.size.toString().padStart(10);
    str += " ";
    str += attrs.mtime.toDateString().slice(4);
    str += " ";
    str += name;

    return str;
};

const flags2mode = (flags) => {
    let mode = 0;

    if ((flags & SFTP_OPEN_MODE.READ) && (flags & SFTP_OPEN_MODE.WRITE)) {
        mode = constants.O_RDWR;
    } else if (flags & SFTP_OPEN_MODE.READ) {
        mode = constants.O_RDONLY;
    } else if (flags & SFTP_OPEN_MODE.WRITE) {
        mode = constants.O_WRONLY;
    }

    if (flags & SFTP_OPEN_MODE.CREAT) {
        mode |= constants.O_CREAT;
    }

    if (flags & SFTP_OPEN_MODE.APPEND) {
        mode |= constants.O_APPEND;
    }

    if (flags & SFTP_OPEN_MODE.EXCL) {
        mode |= constants.O_EXCL;
    }

    if (flags & SFTP_OPEN_MODE.TRUNC) {
        mode |= constants.O_TRUNC;
    }

    return mode;
};

const flags2level = (flags) => {
    let level = "r";

    if (flags & SFTP_OPEN_MODE.READ) {
        level = "r";
    }

    if (flags & SFTP_OPEN_MODE.WRITE) {
        level = "w";
    }

    if (flags & SFTP_OPEN_MODE.CREAT) {
        level = "w";
    }

    if (flags & SFTP_OPEN_MODE.APPEND) {
        level = "w";
    }

    if (flags & SFTP_OPEN_MODE.TRUNC) {
        level = "w";
    }

    if (flags & SFTP_OPEN_MODE.EXCL) {
        level = "x";
    }

    return level;
};

const flags2write = (flags) => {
    let action = "write";

    if (flags & SFTP_OPEN_MODE.APPEND) {
        action = "append";
    }

    if (flags & SFTP_OPEN_MODE.TRUNC) {
        action = "truncate";
    }

    return action;
};

const normalizePath = (pathname) => {
    if (pathname === ".") {
        return "/";
    }

    return pathname;
};

const transformPath = (pathname) => {
    pathname = normalizePath(pathname);

    let name = path.basename(pathname);
    let parentpath = path.dirname(pathname);
    let what = "directory";

    if (name === "$attributes.json") {
        name = "";
        what = "attributes";
    } else if (name === "$properties.json") {
        name = "";
        what = "properties";
    } else if (name === "$file") {
        name = "";
        what = "file";
    } else if (name === "$files") {
        name = "";
        what = "files";
    } else if (path.basename(parentpath) === "$files") {
        parentpath = path.dirname(parentpath);
        what = "file";
    }

    const abspath = path.join(parentpath, name);

    return {
        abspath,
        what
    };
};

class FileSystem extends FileSystemInterface {
    async authenticate(session, request) {
        try {
            assert(request.method === "password");
            await login(session, request.username, request.password);
        } catch {
            throw new PermissionDeniedError();
        }
    }

    async opendir(session, handle) {
        // console.log("opendir", handle);
        handle.setParam("eof", false);
    }

    async open(session, handle, flags) {
        // console.log("open", handle, flags);
        const { abspath, what } = transformPath(handle.pathname);
        const level = flags2level(flags);
        let node;

        try {
            node = await resolve(session, abspath);
        } catch {
            throw new NoSuchFileError();
        }

        try {
            assert(await access(session, abspath, level));
            assert(what !== "properties" || level === "r");
        } catch (e) {
            throw new PermissionDeniedError();
        }

        handle.setParam("what", what);
        handle.setParam("flags", flags);

        if (what === "file") {
            if (node.properties.type !== "f") {
                throw new PermissionDeniedError();
            }

            const filename = path.join(configuration.fileDirectory, node.attributes.diskfilename);
            const file = await fs.open(filename, flags2mode(flags));

            handle.setParam("file", file);
            handle.addDisposable(async () => await file.close());
        } else {
            const action = flags2write(flags);

            if (action === "truncate") {
                handle.setParam("buffer", Buffer.alloc(0));
            } else {
                handle.setParam("buffer", Buffer.from(JSON.stringify(node[what], null, 2)));
            }

            handle.addDisposable(async () => {
                if (what === "attributes") {
                    const current = Buffer.from(JSON.stringify(node[what], null, 2));

                    if (current.compare(handle.getParam("buffer")) !== 0) {
                        await update(session, abspath, JSON.parse(handle.getParam("buffer").toString()));
                    }
                }
            });
        }
    }

    async stat(session, pathname, options) {
        // console.log("stat", pathname, options);
        const { abspath, what } = transformPath(pathname);
        // console.log("what", what);
        // console.log("abspath", abspath);
        const node = await resolve(session, abspath, options);
        // console.log("node", node)
        let size = 0;
        let mode = node.properties.mode;

        if (what === "file") {
            size = node.attributes.size;
            mode |= constants.S_IFREG;
        } else if (what === "files") {
            mode |= constants.S_IFDIR;
            mode &= ~constants.S_IWUSR;
            mode |= constants.S_IXUSR;
            mode &= ~constants.S_IWGRP;
            mode |= constants.S_IXGRP;
            mode &= ~constants.S_IWOTH;
            mode |= constants.S_IXOTH;
        } else if (what === "attributes") {
            size = JSON.stringify(node.attributes, null, 2).length;
            mode |= constants.S_IFREG;
            mode &= ~constants.S_IXUSR;
            mode &= ~constants.S_IXGRP;
            mode &= ~constants.S_IXOTH;
        } else if (what === "properties") {
            size = JSON.stringify(node.properties, null, 2).length;
            mode |= constants.S_IFREG;
            mode &= ~constants.S_IWUSR;
            mode &= ~constants.S_IXUSR;
            mode &= ~constants.S_IWGRP;
            mode &= ~constants.S_IXGRP;
            mode &= ~constants.S_IWOTH;
            mode &= ~constants.S_IXOTH;
        } else if (node.properties.type === "s") {
            mode |= constants.S_IFLNK;
        } else {
            mode |= constants.S_IFDIR;
        }

        const stat = {
            mode: mode,
            uid: node.properties.uid,
            gid: node.properties.uid,
            size: size,
            mtime: node.properties.mtime,
            ctime: node.properties.ctime,
            isDirectory: () => (mode & constants.S_IFDIR) > 0,
            isFile: () => (mode & constants.S_IFREG) > 0,
            isBlockDevice: () => false,
            isCharacterDevice: () => false,
            isSymbolicLink: () => node.properties.type === "s",
            isFIFO: () => false,
            isSocket: () => false
        };


        // console.log("stat", what, abspath, pathname, stat);
        // console.log("node.properties.mode", node.properties.mode)
        // // console.log("constants", constants);
        // console.log("isDirectory", stat.isDirectory())
        // console.log("isFile", stat.isFile())
        // console.log("isSymbolicLink", stat.isSymbolicLink())


        return stat;
    }

    async lstat(session, pathname) {
        return this.stat(session, pathname, { readlink: true });
    }

    async write(session, handle, offset, data) {
        // console.log("write", handle, offset, data);
        const what = handle.getParam("what");

        if (what === "file") {
            const file = handle.getParam("file");
            await file.write(data, offset);
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
        // console.log("read", handle, offset, length);
        const what = handle.getParam("what");

        if (what === "file") {
            const file = handle.getParam("file");
            const attrs = await file.stat();

            if (offset >= attrs.size) {
                return;
            }

            const buffer = Buffer.alloc(length);
            const { bytesRead } = await file.read(buffer, 0, length, offset);

            return buffer.slice(0, bytesRead);
        }

        const buffer = handle.getParam("buffer");

        if (offset >= buffer.length) {
            return;
        }

        return buffer.slice(offset, offset + length);
    }

    async listdir(session, handle) {
        // console.log("listdir", handle);
        if (handle.getParam("eof")) {
            return;
        }

        const { abspath, what } = transformPath(handle.pathname);

        const result = [];

        if (what === "files") {
            let nodes = await list(session, abspath); // TODO: filter directly
            nodes = nodes.filter((node) => node.properties.type === "f");

            for (const node of nodes) {
                const filename = node.name;
                const attrs = await this.lstat(session, path.join(node.path, "$file"));
                const num = 1; // TODO: Number of links and directories inside this directory

                result.push({
                    filename,
                    longname: longname(filename, attrs, num),
                    attrs
                });
            }
        } else {
            const node = await resolve(session, abspath);

            let filename;
            let attrs;
            const num = 1; // TODO: Number of links and directories inside this directory

            filename = "$attributes.json";
            attrs = await this.stat(session, path.join(abspath, filename));
            result.push({
                filename,
                longname: longname(filename, attrs, num),
                attrs
            });

            filename = "$properties.json";
            attrs = await this.lstat(session, path.join(abspath, filename));
            result.push({
                filename,
                longname: longname(filename, attrs, num),
                attrs
            });

            filename = "$files";
            attrs = await this.lstat(session, path.join(abspath, filename));
            result.push({
                filename,
                longname: longname(filename, attrs, num),
                attrs
            });

            if (node.properties.type === "f") {
                filename = "$file";
                attrs = await this.lstat(session, path.join(abspath, filename));
                result.push({
                    filename,
                    longname: longname(filename, attrs, num),
                    attrs
                });
            }

            // console.log("listdir-node", node);

            for (const child of node.properties.children) {
                try {
                    filename = child.name;
                    attrs = await this.lstat(session, path.join(abspath, filename));

                    result.push({
                        filename,
                        longname: longname(filename, attrs, num),
                        attrs
                    });
                } catch {
                }
            }
        }

        // console.log("result", result);

        handle.setParam("eof", true);

        return result;
    }

    // async mkdir(session, pathname, attrs) {
    //     await fs.mkdir(pathname, attrs.mode & ~constants.S_IFMT);
    //     await this.setstat(pathname, {
    //         uid: attrs.uid,
    //         gid: attrs.gid,
    //         atime: attrs.atime,
    //         mtime: attrs.mtime
    //     });
    // }
    //
    // async setstat(session, pathname, attrs) {
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
    //     await fs.rename(oldPathname, newPathname);
    // }
    //
    // async rmdir(session, pathname) {
    //     await fs.rmdir(pathname);
    // }
    //
    // async remove(session, pathname) {
    //     await fs.unlink(pathname);
    // }

    async realpath(session, pathname) {
        // console.log("realpath", pathname);

        const { abspath } = transformPath(pathname);
        const node = await resolve(session, abspath);

        // console.log("realpath", abspath, "=", node.path);

        return node.path;
    }

    async readlink(session, pathname) {
        // console.log("readlink", pathname);

        const { abspath } = transformPath(pathname);
        const node = await resolve(session, abspath, { readlink: true });

        assert(node.properties.type === "s");

        // console.log("readlink", abspath, "=", node.attributes.path);

        return node.attributes.path;
    }

    // async symlink(session, targetPathname, linkPathname) {
    //     return await fs.symlink(targetPathname, linkPathname);
    // }
}

module.exports = FileSystem;
