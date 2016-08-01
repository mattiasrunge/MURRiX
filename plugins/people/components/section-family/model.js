"use strict";

/* TODO:
 * Should implement a fullscreen option
 * Height should be adjusted if the window is resized
 */

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const utils = require("lib/utils");
const stat = require("lib/status");

module.exports = utils.wrapComponent(function*(params) {
    this.nodepath = params.nodepath;
    this.person = ko.observable(false);
    this.height = ko.observable(300);
    this.zoom = ko.observable(0.8);

    let dragging = false;
    let canvasElement = false;
    let markDragging = false;
    let markElement = false;
    let meOffset = { top: 0, left: 0 };
    let canvasSize = { width: 0, height: 0 };

    this.startDragHandler = (data, event) => {
        dragging = { top: event.clientY, left: event.clientX };
        canvasElement = $("#relation-canvas");
    };

    this.dragHandler = (data, event) => {
        event.preventDefault();
        event.stopPropagation();

        if (dragging) {
            let diffTop = event.clientY - dragging.top;
            let diffLeft = event.clientX - dragging.left;

            let position = canvasElement.position();

            canvasElement.css("top", position.top + diffTop);
            canvasElement.css("left", position.left + diffLeft);

            dragging = { top: event.clientY, left: event.clientX };
            this._storePosition();
        } else if (markDragging) {
            let top = event.clientY - markElement.offset().top;

            this.setZoomByPosition(top, true);
        }
    };

    this.stopDragHandler = (data, event) => {
        event.preventDefault();
        event.stopPropagation();

        if (dragging) {
            dragging = false;
            canvasElement = false;
        }

        if (markDragging) {
            let top = event.clientY - markElement.offset().top;

            this.setZoomByPosition(top);

            markDragging = false;
        }
    };

    this.round = (value, precision) => {
        return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
    };

    this.scrollHandler = (/*data, event*/) => {
//         let wheelData = event.detail ? event.detail * -1 : event.wheelDelta / 40;
//
//         wheelData /= 50;
//
//         event.preventDefault();
//         event.stopPropagation();
//
//         this.zoomSet(this.round(this.zoom() + wheelData, 1));
    };

    this.zoomSet = (value, noanimation) => {
        value = value < 0.2 ? 0.2 : value;
        value = value > 1.6 ? 1.6 : value;

        this.zoom(value);
        this._adjustCanvasPosition();

        let markElement = $(".mark-container .mark");

        let containerHeight = $(".mark-container").innerHeight();
        let markHeight = markElement.outerHeight();

        containerHeight -= markHeight;
        value -= 0.1;

        let step = containerHeight / 14;
        let top = (containerHeight - step * ((value - 0.1) * 10));

        markElement.stop();

        if (noanimation) {
            markElement.css("top", top);
        } else {
            markElement.animate({ top: top }, 50);
        }
    };

    this.zoomInc = () => {
        this.zoomSet(this.zoom() + 0.1);
    };

    this.zoomDec = () => {
        this.zoomSet(this.zoom() - 0.1);
    };

    this.markContainerClickHandler = (data, event) => {
        event.preventDefault();
        event.stopPropagation();

        if (event.srcElement !== $(".mark-container")[0]) {
            return;
        }

        this.setZoomByPosition(event.offsetY);
    };

    this.setZoomByPosition = (top, noanimation) => {
        let containerHeight = $(".mark-container").innerHeight();
        let markHeight = $(".mark-container .mark").outerHeight();

        top -= markHeight;
        containerHeight -= markHeight;

        let step = containerHeight / 14;

        this.zoomSet(this.round((containerHeight - top) / (step * 10), 1) + 0.1, noanimation);
    };

    this.startDragMarkHandler = (data, event) => {
        event.preventDefault();
        event.stopPropagation();

        markElement = $(".mark-container");
        markDragging = true;
    };

    this._storePosition = () => {
        let canvasElement = $("#relation-canvas");
        let meElement = $(".relation-me");

        meOffset = meElement.offset();
        canvasSize = { width: canvasElement.width(), height: canvasElement.height() };
    };

    this._adjustCanvasPosition = () => {
        let canvasElement = $("#relation-canvas");

        if (canvasElement.is(":visible")) {
            let size = { width: canvasElement.width(), height: canvasElement.height() };

            let diffHeight = (canvasSize.height - size.height) / 2;
            let diffWidth = (canvasSize.width - size.width) / 2;

            let position = canvasElement.position();

            canvasElement.css("top", position.top + diffHeight);
            canvasElement.css("left", position.left + diffWidth);

            this._storePosition();
        }
    };

    this._adjustPosition = () => {
        let canvasElement = $("#relation-canvas");

        if (canvasElement.is(":visible")) {
            let meElement = $(".relation-me");
            let offset = meElement.offset();

            let diffTop = meOffset.top - offset.top;
            let diffLeft = meOffset.left - offset.left;

            let position = canvasElement.position();

            canvasElement.css("top", position.top + diffTop);
            canvasElement.css("left", position.left + diffLeft);

            this._storePosition();
        }
    };

    this._center = () => {
        let meElement = $(".relation-me");

        if (meElement.length === 0 || meElement.width() === 0) {
            setTimeout(() => {
                this._center();
            }, 100);
            return;
        }

        let canvasElement = $("#relation-canvas");
        let element = $("#relation-element");

        let position = meElement.position();
        position.left -= (element.width() - meElement.width()) / 2;
        position.top -= (this.height() - meElement.height()) / 2;

        canvasElement.css("top", -position.top);
        canvasElement.css("left", -position.left);

        this._storePosition();
    };

    this.createPerson = (parentNodeData, nodeData, nodePath, metrics, type, index, count) => {
        console.log("createPerson", nodeData, nodePath);
        nodeData.tree = {};
        nodeData.tree.parentsVisible = ko.observable(false);
        nodeData.tree.childrenVisible = ko.observable(false);
        nodeData.tree.first = index === 0;
        nodeData.tree.last = index === count - 1;
        nodeData.tree.type = type;
        nodeData.tree.parentsLoading = ko.observable(false);
        nodeData.tree.childrenLoading = ko.observable(false);
        nodeData.tree.parentsLoaded = false;
        nodeData.tree.childrenLoaded = false;
        nodeData.tree.parents = ko.observableArray();
        nodeData.tree.children = ko.observableArray();
        nodeData.tree.nodepath = ko.observable({ node: nodeData, path: nodePath });
        nodeData.tree.metrics = ko.observable(metrics);

        nodeData.tree.expandParents = () => {
            nodeData.tree.parentsVisible(!nodeData.tree.parentsVisible());
            this._adjustPosition();
        };

        nodeData.tree.expandChildren = () => {
            nodeData.tree.childrenVisible(!nodeData.tree.childrenVisible());
            this._adjustPosition();
        };

        nodeData.tree.loadParents = utils.co(function*() {
            if (!nodeData.tree.parents.loaded) {
                nodeData.tree.parents.loaded = true;
                nodeData.tree.parentsLoading(true);

                let list = yield api.vfs.list(nodePath + "/parents");

                nodeData.tree.parentsLoading(false);

                list.sort(function(a, b) {
                    if (a.node.attributes.gender === b.node.attributes.gender) {
                        return 0;
                    } else if (a.node.attributes.gender === "m") {
                        return 1;
                    } else if (a.node.attributes.gender === "f") {
                        return -1;
                    }

                    return 0;
                });

                for (let n = 0; n < list.length; n++) {
                    let metrics = yield api.people.getMetrics(list[n].path);

                    nodeData.tree.parents.push(this.createPerson(nodeData, list[n].node, list[n].path, metrics, "parent", n, list.length));
                }

                this._adjustPosition();
            }
        }.bind(this));

        nodeData.tree.loadChildren = utils.co(function*() {
            if (!nodeData.tree.children.loaded) {
                nodeData.tree.children.loaded = true;
                nodeData.tree.childrenLoading(true);

                let list = yield api.vfs.list(nodePath + "/children");

                nodeData.tree.childrenLoading(false);

                for (let child of list) {
                    child.metrics = yield api.people.getMetrics(child.path);
                }

                list.sort((a, b) => {
                    console.log(a, b);
                    if (a.metrics.birthdate === b.metrics.birthdate) {
                        return 0;
                    } else if (!a.metrics.birthdate) {
                        return -1;
                    } else if (!b.metrics.birthdate) {
                        return 1;
                    }

                    return b.metrics.age - a.metrics.age;
                });

                for (let n = 0; n < list.length; n++) {
                    nodeData.tree.children.push(this.createPerson(nodeData, list[n].node, list[n].path, list[n].metrics, "child", n, list.length));
                }

                this._adjustPosition();
            }
        }.bind(this));


        if (!parentNodeData) {
            nodeData.tree.loadParents().catch(stat.printError);
            nodeData.tree.loadChildren().catch(stat.printError);
        } else {
            parentNodeData.tree.parentsVisible.subscribe((value) => {
                if (value) {
                    nodeData.tree.loadParents();
                }
            });

            parentNodeData.tree.childrenVisible.subscribe((value) => {
                if (value) {
                    nodeData.tree.loadChildren();
                }
            });
        }

        return nodeData;
    };

    this.afterRender = () => {
        this.height($(window).height() - 51);

        this._center();
        this.zoomSet(0.8);
    };

    this.zoomSet(0.8);

    this.person = ko.asyncComputed(false, function*(setter) {
        if (!this.nodepath()) {
            return false;
        }

        setter(false);

        let metrics = yield api.people.getMetrics(this.nodepath().path);

        return this.createPerson(null, this.nodepath().node(), this.nodepath().path, metrics, "me", 0, 1);
    }.bind(this), (error) => {
        stat.printError(error);
        return false;
    });


    this.dispose = () => {
    };
});
