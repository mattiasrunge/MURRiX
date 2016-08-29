"use strict";

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const ui = require("lib/ui");
const node = require("lib/node");
const loc = require("lib/location");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
    this.showPath = ko.pureComputed(() => ko.unwrap(params.showPath));

    this.sidebarView = ko.observable("main");

    this.personPath = ko.observable(false);
    this.selectedTag = ko.observable(false);
    this.height = ko.pureComputed(() => {
        let screenHeight = ko.unwrap(ui.windowSize()).height;
        let heights = [ 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000 ];

        for (let height of heights) {
            if (screenHeight < height) {
                return height;
            }
        }

        return heights[heights.length - 1];
    });

    this.position = ko.pureComputed({
        read: () => {
            if (!this.nodepath()) {
                return false;
            }

            if (this.nodepath().node().attributes.where) {
                if (this.nodepath().node().attributes.where.gps) {
                    return this.nodepath().node().attributes.where.gps;
                } else if (this.nodepath().node().attributes.where.manual) {
                    return this.nodepath().node().attributes.where.manual;
                }
            }

            return false;
        },
        write: (position) => {
            let where = this.nodepath().node().attributes.where;

            where.manual = position;

            api.vfs.setattributes(this.nodepath().path, { where: where })
            .then((node) => {
                this.nodepath().node(node);
            })
            .catch((error) => {
                stat.printError(error);
            });
        }
    });

    this.location = ko.asyncComputed(false, function*(setter) {
        if (!this.nodepath()) {
            return false;
        }

        setter(false);

        let node = yield api.vfs.resolve(this.nodepath().path + "/location", { noerror: true });

        console.log("location", node);

        return node;
    }.bind(this), (error) => {
        stat.printError(error);
        return false;
    });

    this.nodepath = ko.asyncComputed(false, function*(setter) {
        let abspath = ko.unwrap(this.showPath);
        let versions = [];

        setter(false);

        this.loading(true);
        let item = yield api.vfs.resolve(abspath, { noerror: true });

        console.log("item", item);

        if (!item) {
            this.loading(false);
            return false;
        }

        let editable = yield api.vfs.access(abspath, "w");

        versions = yield api.vfs.list(abspath + "/versions", {
            noerror: true
        });

        console.log("versions", versions);

        this.loading(false);

        return { node: ko.observable(item), path: abspath, versions: versions, editable: editable };
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    this.initialCameraName = ko.pureComputed(() => {
        if (!this.nodepath()) {
            return "";
        }

        if (this.nodepath().node().attributes.deviceinfo) {
            return this.nodepath().node().attributes.deviceinfo.model || "";
        }

        return "";
    });

    this.filename = ko.asyncComputed(false, function*(setter) {
        if (!this.nodepath()) {
            return false;
        }

        setter(false);

        let height = ko.unwrap(this.height);
        let filename = false;

        this.loading(true);

        if (this.nodepath().node().attributes.type === "image") {
            filename = (yield api.file.getPictureFilenames([ this.nodepath().node()._id ], null, height))[0];
        } else if (this.nodepath().node().attributes.type === "video") {
            filename = (yield api.file.getVideoFilenames([ this.nodepath().node()._id ], null, height))[0];
        } else if (this.nodepath().node().attributes.type === "audio") {
            filename = (yield api.file.getAudioFilenames([ this.nodepath().node()._id ]))[0];
        }

        this.loading(false);

        return filename ? filename.filename : false;
    }.bind(this), (error) => {
        this.loading(false);
        stat.printError(error);
        return false;
    });

    this.tags = ko.asyncComputed([], function*(setter) {
        if (!this.nodepath()) {
            return [];
        }

        setter([]);

        let tags = yield api.vfs.list(this.nodepath().path + "/tags", {
            noerror: true
        });

        console.log("tags", tags);

        return tags;
    }.bind(this), (error) => {
        stat.printError(error);
        return [];
    });

    this.tagNames = ko.pureComputed(() => {
        return this.tags()
        .map((tag) => tag.node.attributes.name)
        .join("<br>");
    });

    this.selectTag = ko.pureComputed({
        read: () => {
            if (!this.selectedTag()) {
                return false;
            }

            if (!this.selectedTag().link.attributes.y || !this.selectedTag().link.attributes.x || !this.selectedTag().link.attributes.width || !this.selectedTag().link.attributes.height) {
                return { x1: false, x2: false, width: false, height: false };
            }

            return { x: this.selectedTag().link.attributes.x, y: this.selectedTag().link.attributes.y, width: this.selectedTag().link.attributes.width, height: this.selectedTag().link.attributes.height };
        },
        write: (value) => {
            let attributes;

            if (!this.selectedTag().link.attributes.x && !value) {
                return;
            } else if (!value) {
                attributes = {
                    x: null,
                    y: null,
                    width: null,
                    height: null
                };
            } else if (this.selectedTag().link.attributes.y !== value.y || this.selectedTag().link.attributes.x !== value.x || this.selectedTag().link.attributes.width !== value.width || this.selectedTag().link.attributes.height !== value.height) {
                attributes = value;
            } else {
                return;
            }

            api.vfs.lookup(this.selectedTag().link._id)
            .then((abspaths) => {
                return api.vfs.setattributes(abspaths[0], attributes);
            })
            .catch((error) => {
                stat.printError(error);
            });
        },
        owner: this
    });

    this.selectDone = () => {
        this.selectedTag(false);
        this.tags.reload();
    };

    //     this.faces = ko.asyncComputed([], function*(setter) {
    //         let abspath = ko.unwrap(this.showPath);
    //
    //         setter([]);
    //
    //         let faces = yield api.file.getFaces(abspath);
    //
    //         console.log("faces", faces);
    //
    //         return faces;
    //     }.bind(this), (error) => {
    //         stat.printError(error);
    //         return [];
    //     });

    this.currentIndex = ko.pureComputed(() => {
        if (!this.nodepath()) {
            return -1;
        }

        let nodepath = node.list().filter((nodepath2) => nodepath2.node._id === this.nodepath().node()._id)[0];

        return node.list().indexOf(nodepath);
    });

    this.nextPath = ko.pureComputed(() => {
        let index = this.currentIndex();

        if (index === -1) {
            return false;
        }

        index++;

        if (index >= node.list().length) {
            index = 0;
        }

        return node.list()[index].path;
    });

    this.previousPath = ko.pureComputed(() => {
        let index = this.currentIndex();

        if (index === -1) {
            return false;
        }

        index--;

        if (index < 0) {
            index = node.list().length - 1;
        }

        return node.list()[index].path;
    });

    let nextFile = ko.computed(utils.co(function*() {
        let abspath = this.nextPath();

        if (!abspath) {
            return;
        }

        let node = yield api.vfs.resolve(abspath, { noerror: true });

        if (!node) {
            return;
        }

        let height = ko.unwrap(this.height);

        if (node.attributes.type === "image") {
            let filenames = (yield api.file.getPictureFilenames([ node._id ], null, height))[0];

            let image = new Image();
            image.src = filenames.filename;
        }
    }.bind(this)));

    let previousFile = ko.computed(utils.co(function*() {
        let abspath = this.previousPath();

        if (!abspath) {
            return;
        }

        let node = yield api.vfs.resolve(abspath, { noerror: true });

        if (!node) {
            return;
        }

        let height = ko.unwrap(this.height);

        if (node.attributes.type === "image") {
            let filenames = (yield api.file.getPictureFilenames([ node._id ], null, height))[0];

            let image = new Image();
            image.src = filenames.filename;
        }
    }.bind(this)));

    this.rotate = (offset) => {
        if (!this.nodepath().editable) {
            return;
        }

        offset = parseInt(offset, 10);

        if (this.nodepath().node().attributes.mirror) {
            offset = -offset;
        }

        let angle = parseInt(this.nodepath().node().attributes.angle || 0, 10) + offset;

        if (angle < 0) {
            angle += 360;
        } else if (angle > 270) {
            angle -= 360;
        }

        api.vfs.setattributes(this.nodepath().path, { angle: angle })
        .then((node) => {
            this.nodepath().node(node);
            console.log("Saving angle attribute as " + angle + " successfully!", node);
        })
        .catch((error) => {
            stat.printError(error);
        });
    };

    this.mirror = () => {
        if (!this.nodepath().editable) {
            return;
        }

        let mirror = !this.nodepath().node().attributes.mirror;

        api.vfs.setattributes(this.nodepath().path, { mirror: mirror })
        .then((node) => {
            this.nodepath().node(node);
            console.log("Saving mirror attribute as " + mirror + " successfully!", node);
        })
        .catch((error) => {
            stat.printError(error);
        });
    };

    this.exit = () => {
        if (this.sidebarView() === "time" || this.sidebarView() === "tag" || this.sidebarView() === "position") {
            this.sidebarView("main");
        } else {
            loc.goto({ showPath: null });
        }
    };

    this.removeTag = (tag) => {
        api.vfs.unlink(this.showPath() + "/tags/" + tag.name)
        .then(() => {
            this.tags.reload();
        })
        .catch((error) => {
            stat.printError(error);
        });
    };

    let subscription = this.personPath.subscribe((value) => {
        if (!value) {
            return;
        }

        this.personPath(false);

        api.vfs.symlink(value, this.showPath() + "/tags")
        .then(() => {
            this.tags.reload();
        })
        .catch((error) => {
            stat.printError(error);
        });
    });

    this.dispose = () => {
        nextFile.dispose();
        previousFile.dispose();
        subscription.dispose();
        stat.destroy(this.loading);
    };
});
