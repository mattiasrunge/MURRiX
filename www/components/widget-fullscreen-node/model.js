"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");
const ui = require("lib/ui");
const node = require("lib/node");
const loc = require("lib/location");

module.exports = utils.wrapComponent(function*(params) {
    this.loading = stat.create();
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

    this.showPath = ko.pureComputed(() => ko.unwrap(params.showPath));
    this.nodepath = ko.nodepath(this.showPath);

    this.locationPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().path + "/location" : false);
    this.location = ko.nodepath(this.locationPath, { noerror: true });

    this.versionsPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().path + "/versions" : false);
    this.versions = ko.nodepathList(this.versionsPath, { noerror: true });

    this.tagsPath = ko.pureComputed(() => this.nodepath() ? this.nodepath().path + "/tags" : false);
    this.tags = ko.nodepathList(this.tagsPath, { noerror: true });

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

    this.tagNames = ko.pureComputed(() => {
        return this.tags()
        .map((tag) => tag.node().attributes.name)
        .join("<br>");
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

    this.selectTag = ko.pureComputed({
        read: () => {
            if (!this.selectedTag()) {
                return false;
            }

            if (!this.selectedTag().link.attributes.y ||
                !this.selectedTag().link.attributes.x ||
                !this.selectedTag().link.attributes.width ||
                !this.selectedTag().link.attributes.height) {
                return {
                    x: false,
                    y: false,
                    width: false,
                    height: false
                };
            }

            return {
                x: this.selectedTag().link.attributes.x,
                y: this.selectedTag().link.attributes.y,
                width: this.selectedTag().link.attributes.width,
                height: this.selectedTag().link.attributes.height
            };
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
            } else if (this.selectedTag().link.attributes.y !== value.y ||
                       this.selectedTag().link.attributes.x !== value.x ||
                       this.selectedTag().link.attributes.width !== value.width ||
                       this.selectedTag().link.attributes.height !== value.height) {
                attributes = value;
            } else {
                return;
            }

            api.vfs.lookup(this.selectedTag().link._id)
            .then((abspaths) => {
                return api.vfs.setattributes(abspaths[0], attributes);
            })
            .then(() => {
                this.selectedTag(false);
            })
            .catch((error) => {
                stat.printError(error);
            });
        },
        owner: this
    });

    this.surroundings = ko.pureComputed(() => {
        if (!this.nodepath()) {
            return false;
        }

        let index = node.list()
        .map((nodepath) => nodepath.path)
        .indexOf(this.nodepath().path);

        if (index === -1) {
            return false;
        }

        let result = {};

        if (index + 1 >= node.list().length) {
            result.next = node.list()[0];
        } else {
            result.next = node.list()[index + 1];
        }

        if (index - 1 < 0) {
            result.previous = node.list()[node.list().length - 1];
        } else {
            result.previous = node.list()[index - 1];
        }

        return result;
    });

    let surroundingsLoad = ko.computed(utils.co(function*() {
        if (!this.surroundings()) {
            return;
        }

        let ids = [ this.surroundings().previous.node()._id, this.surroundings().next.node()._id ];
        let filenames = yield api.file.getPictureFilenames(ids, null, ko.unwrap(this.height));

        for (let filename of filenames) {
            (new Image()).src = filename.filename;
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
        .catch((error) => {
            stat.printError(error);
        });
    });

    this.dispose = () => {
        this.nodepath.dispose();
        this.location.dispose();
        this.versions.dispose();
        this.tags.dispose();
        surroundingsLoad.dispose();
        subscription.dispose();
        stat.destroy(this.loading);
    };
});
