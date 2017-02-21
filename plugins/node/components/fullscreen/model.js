"use strict";

const ko = require("knockout");
const api = require("api.io-client");
const stat = require("lib/status");
const ui = require("lib/ui");
const loc = require("lib/location");

model.loading = stat.create();
model.sidebarView = ko.observable("main");
model.personPath = ko.observable(false);
model.selectedTag = ko.observable(false);
model.height = ko.pureComputed(() => {
    if (!model.nodepath()) {
        return 0;
    }

    if (model.nodepath().node().attributes.type === "image") {
        let screenHeight = ko.unwrap(ui.windowSize()).height;
        let heights = [ 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000 ];

        for (let height of heights) {
            if (screenHeight < height) {
                return height;
            }
        }

        return heights[heights.length - 1];
    } else if (model.nodepath().node().attributes.type === "video") {
        return model.nodepath().node().attributes.fileinfo.height;
    }

    return 0;
});

model.showPath = ko.pureComputed(() => ko.unwrap(params.showPath));
model.nodepath = ko.nodepath(model.showPath);

model.locationPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/location" : false);
model.location = ko.nodepath(model.locationPath, { noerror: true });

model.versionsPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/versions" : false);
model.versions = ko.nodepathList(model.versionsPath, { noerror: true });

model.tagsPath = ko.pureComputed(() => model.nodepath() ? model.nodepath().path + "/tags" : false);
model.tags = ko.nodepathList(model.tagsPath, { noerror: true });

model.initialCameraName = ko.pureComputed(() => {
    if (!model.nodepath()) {
        return "";
    }

    if (model.nodepath().node().attributes.deviceinfo) {
        return model.nodepath().node().attributes.deviceinfo.model || "";
    }

    return "";
});

model.filename = ko.asyncComputed(false, async (setter) => {
    if (!model.nodepath()) {
        return false;
    }

    setter(false);

    let height = ko.unwrap(model.height);
    let filename = false;

    model.loading(true);

    if (model.nodepath().node().attributes.type === "image") {
        filename = await api.file.getMediaUrl(model.nodepath().node()._id, {
            height: height,
            type: "image"
        });
    } else if (model.nodepath().node().attributes.type === "video") {
        filename = await api.file.getMediaUrl(model.nodepath().node()._id, {
            height: height,
            type: "video"
        });
    } else if (model.nodepath().node().attributes.type === "audio") {
        filename = await api.file.getMediaUrl(model.nodepath().node()._id, {
            type: "audio"
        });
    } else if (model.nodepath().node().attributes.type === "document") {
        filename = await api.file.getMediaUrl(model.nodepath().node()._id, {
            type: "document"
        });
    }

    console.log("filename", filename);

    model.loading(false);

    return filename ? filename : false;
}, (error) => {
    model.loading(false);
    stat.printError(error);
    return false;
});

model.tagNames = ko.pureComputed(() => {
    return model.tags()
    .map((tag) => tag.node().attributes.name)
    .join("<br>");
});

model.position = ko.pureComputed({
    read: () => {
        if (!model.nodepath()) {
            return false;
        }

        if (model.nodepath().node().attributes.where) {
            if (model.nodepath().node().attributes.where.gps) {
                return model.nodepath().node().attributes.where.gps;
            } else if (model.nodepath().node().attributes.where.manual) {
                return model.nodepath().node().attributes.where.manual;
            }
        }

        return false;
    },
    write: (position) => {
        let where = model.nodepath().node().attributes.where;

        where.manual = position;

        api.vfs.setattributes(model.nodepath().path, { where: where })
        .then((node) => {
            model.nodepath().node(node);
        })
        .catch((error) => {
            stat.printError(error);
        });
    }
});

model.selectTag = ko.pureComputed({
    read: () => {
        if (!model.selectedTag()) {
            return false;
        }

        if (!model.selectedTag().link.attributes.y ||
            !model.selectedTag().link.attributes.x ||
            !model.selectedTag().link.attributes.width ||
            !model.selectedTag().link.attributes.height) {
            return {
                x: false,
                y: false,
                width: false,
                height: false
            };
        }

        return {
            x: model.selectedTag().link.attributes.x,
            y: model.selectedTag().link.attributes.y,
            width: model.selectedTag().link.attributes.width,
            height: model.selectedTag().link.attributes.height
        };
    },
    write: (value) => {
        let attributes;

        if (!model.selectedTag().link.attributes.x && !value) {
            return;
        } else if (!value) {
            attributes = {
                x: null,
                y: null,
                width: null,
                height: null
            };
        } else if (model.selectedTag().link.attributes.y !== value.y ||
                    model.selectedTag().link.attributes.x !== value.x ||
                    model.selectedTag().link.attributes.width !== value.width ||
                    model.selectedTag().link.attributes.height !== value.height) {
            attributes = value;
        } else {
            return;
        }

        api.vfs.lookup(model.selectedTag().link._id)
        .then((abspaths) => {
            return api.vfs.setattributes(abspaths[0], attributes);
        })
        .then(() => {
            model.selectedTag(false);
        })
        .catch((error) => {
            stat.printError(error);
        });
    },
    owner: model
});

model.surroundings = ko.pureComputed(() => {
    if (!model.nodepath()) {
        return false;
    }

    let index = params.list()
    .map((nodepath) => nodepath.path)
    .indexOf(model.nodepath().path);

    if (index === -1) {
        return false;
    }

    let result = {};

    if (index + 1 >= params.list().length) {
        result.next = params.list()[0];
    } else {
        result.next = params.list()[index + 1];
    }

    if (index - 1 < 0) {
        result.previous = params.list()[params.list().length - 1];
    } else {
        result.previous = params.list()[index - 1];
    }

    return result;
});

let surroundingsLoad = ko.computed(async () => {
    if (!model.surroundings()) {
        return;
    }

    let ids = [ model.surroundings().previous.node()._id, model.surroundings().next.node()._id ];
    let filenames = await api.file.getMediaUrl(ids, {
        height: ko.unwrap(model.height),
        type: "image"
    });

    for (let id of ids) {
        if (filenames[id]) {
            (new Image()).src = filenames[id];
        }
    }
});

model.rotate = (offset) => {
    if (!model.nodepath().editable) {
        return;
    }

    offset = parseInt(offset, 10);

    if (model.nodepath().node().attributes.mirror) {
        offset = -offset;
    }

    let angle = parseInt(model.nodepath().node().attributes.angle || 0, 10) + offset;

    if (angle < 0) {
        angle += 360;
    } else if (angle > 270) {
        angle -= 360;
    }

    api.vfs.setattributes(model.nodepath().path, { angle: angle })
    .then((node) => {
        console.log("Saving angle attribute as " + angle + " successfully!", node);
    })
    .catch((error) => {
        stat.printError(error);
    });
};

model.mirror = () => {
    if (!model.nodepath().editable) {
        return;
    }

    let mirror = !model.nodepath().node().attributes.mirror;

    api.vfs.setattributes(model.nodepath().path, { mirror: mirror })
    .then((node) => {
        console.log("Saving mirror attribute as " + mirror + " successfully!", node);
    })
    .catch((error) => {
        stat.printError(error);
    });
};

model.exit = () => {
    if (model.sidebarView() === "time" || model.sidebarView() === "tag" || model.sidebarView() === "position") {
        model.sidebarView("main");
    } else {
        loc.goto({ showPath: null });
    }
};

model.removeTag = (tag) => {
    api.vfs.unlink(model.showPath() + "/tags/" + tag.name)
    .catch((error) => {
        stat.printError(error);
    });
};

let subscription = model.personPath.subscribe((value) => {
    if (!value) {
        return;
    }

    model.personPath(false);

    api.vfs.symlink(value, model.showPath() + "/tags")
    .catch((error) => {
        stat.printError(error);
    });
});

const dispose = () => {
    model.nodepath.dispose();
    model.location.dispose();
    model.versions.dispose();
    model.tags.dispose();
    surroundingsLoad.dispose();
    subscription.dispose();
    stat.destroy(model.loading);
};
