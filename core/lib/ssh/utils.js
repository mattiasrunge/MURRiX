"use strict";

const path = require("path");
const { constants } = require("fs");
const { SFTP_OPEN_MODE } = require("ssh2");

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
    } else if (name === "$files") {
        name = "";
        what = "files";
    } else if (path.basename(parentpath) === "$files") {
        parentpath = path.dirname(parentpath);
        what = "file";
    } else if (name.startsWith("$")) {
        name = "";
        what = "file";
    }

    const abspath = path.join(parentpath, name);

    return {
        abspath,
        what
    };
};

module.exports = {
    longname,
    flags2mode,
    flags2level,
    flags2write,
    normalizePath,
    transformPath
};
