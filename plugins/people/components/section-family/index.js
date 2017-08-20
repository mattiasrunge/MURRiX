
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const ko = require("knockout");
const $ = require("jquery");
const api = require("api.io-client");
const stat = require("lib/status");

class PeopleSectionFamily extends Knockout {
    async getModel() {
        const model = {};

        model.nodepath = ko.pureComputed(() => ko.unwrap(this.props.nodepath));
        model.person = ko.observable(false);
        model.height = ko.observable(300);
        model.zoom = ko.observable(0.8);

        let dragging = false;
        let canvasElement = false;
        let markDragging = false;
        let markElement = false;
        let meOffset = { top: 0, left: 0 };
        let canvasSize = { width: 0, height: 0 };

        model.startDragHandler = (data, event) => {
            dragging = { top: event.clientY, left: event.clientX };
            canvasElement = $("#relation-canvas");
        };

        model.dragHandler = (data, event) => {
            event.preventDefault();
            event.stopPropagation();

            if (dragging) {
                let diffTop = event.clientY - dragging.top;
                let diffLeft = event.clientX - dragging.left;

                let position = canvasElement.position();

                canvasElement.css("top", position.top + diffTop);
                canvasElement.css("left", position.left + diffLeft);

                dragging = { top: event.clientY, left: event.clientX };
                model._storePosition();
            } else if (markDragging) {
                let top = event.clientY - markElement.offset().top;

                model.setZoomByPosition(top, true);
            }
        };

        model.stopDragHandler = (data, event) => {
            event.preventDefault();
            event.stopPropagation();

            if (dragging) {
                dragging = false;
                canvasElement = false;
            }

            if (markDragging) {
                let top = event.clientY - markElement.offset().top;

                model.setZoomByPosition(top);

                markDragging = false;
            }
        };

        model.round = (value, precision) => {
            return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
        };

        model.scrollHandler = (/*data, event*/) => {
            //         let wheelData = event.detail ? event.detail * -1 : event.wheelDelta / 40;
            //
            //         wheelData /= 50;
            //
            //         event.preventDefault();
            //         event.stopPropagation();
            //
            //         model.zoomSet(model.round(model.zoom() + wheelData, 1));
        };

        model.zoomSet = (value, noanimation) => {
            value = value < 0.2 ? 0.2 : value;
            value = value > 1.6 ? 1.6 : value;

            model.zoom(value);
            model._adjustCanvasPosition();

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

        model.zoomInc = () => {
            model.zoomSet(model.zoom() + 0.1);
        };

        model.zoomDec = () => {
            model.zoomSet(model.zoom() - 0.1);
        };

        model.markContainerClickHandler = (data, event) => {
            event.preventDefault();
            event.stopPropagation();

            if (event.srcElement !== $(".mark-container")[0]) {
                return;
            }

            model.setZoomByPosition(event.offsetY);
        };

        model.setZoomByPosition = (top, noanimation) => {
            let containerHeight = $(".mark-container").innerHeight();
            let markHeight = $(".mark-container .mark").outerHeight();

            top -= markHeight;
            containerHeight -= markHeight;

            let step = containerHeight / 14;

            model.zoomSet(model.round((containerHeight - top) / (step * 10), 1) + 0.1, noanimation);
        };

        model.startDragMarkHandler = (data, event) => {
            event.preventDefault();
            event.stopPropagation();

            markElement = $(".mark-container");
            markDragging = true;
        };

        model._storePosition = () => {
            let canvasElement = $("#relation-canvas");
            let meElement = $(".relation-me");

            meOffset = meElement.offset();
            canvasSize = { width: canvasElement.width(), height: canvasElement.height() };
        };

        model._adjustCanvasPosition = () => {
            let canvasElement = $("#relation-canvas");

            if (canvasElement.is(":visible")) {
                let size = { width: canvasElement.width(), height: canvasElement.height() };

                let diffHeight = (canvasSize.height - size.height) / 2;
                let diffWidth = (canvasSize.width - size.width) / 2;

                let position = canvasElement.position();

                canvasElement.css("top", position.top + diffHeight);
                canvasElement.css("left", position.left + diffWidth);

                model._storePosition();
            }
        };

        model._adjustPosition = () => {
            let canvasElement = $("#relation-canvas");

            if (canvasElement.is(":visible")) {
                let meElement = $(".relation-me");
                let offset = meElement.offset();

                let diffTop = meOffset.top - offset.top;
                let diffLeft = meOffset.left - offset.left;

                let position = canvasElement.position();

                canvasElement.css("top", position.top + diffTop);
                canvasElement.css("left", position.left + diffLeft);

                model._storePosition();
            }
        };

        model._center = () => {
            let meElement = $(".relation-me");

            if (meElement.length === 0 || meElement.width() === 0) {
                setTimeout(() => {
                    model._center();
                }, 100);
                return;
            }

            let canvasElement = $("#relation-canvas");
            let element = $("#relation-element");

            let position = meElement.position();
            position.left -= (element.width() - meElement.width()) / 2;
            position.top -= (model.height() - meElement.height()) / 2;

            canvasElement.css("top", -position.top);
            canvasElement.css("left", -position.left);

            model._storePosition();
        };

        model.createPerson = (parentNodeData, nodeData, nodePath, metrics, type, index, count) => {
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
                model._adjustPosition();
            };

            nodeData.tree.expandChildren = () => {
                nodeData.tree.childrenVisible(!nodeData.tree.childrenVisible());
                model._adjustPosition();
            };

            nodeData.tree.loadParents = async () => {
                if (!nodeData.tree.parents.loaded) {
                    nodeData.tree.parents.loaded = true;
                    nodeData.tree.parentsLoading(true);

                    let list = await api.vfs.list(nodePath + "/parents");

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
                        let metrics = await api.people.getMetrics(list[n].path);

                        nodeData.tree.parents.push(model.createPerson(nodeData, list[n].node, list[n].path, metrics, "parent", n, list.length));
                    }

                    model._adjustPosition();
                }
            };

            nodeData.tree.loadChildren = async () => {
                if (!nodeData.tree.children.loaded) {
                    nodeData.tree.children.loaded = true;
                    nodeData.tree.childrenLoading(true);

                    let list = await api.vfs.list(nodePath + "/children");

                    nodeData.tree.childrenLoading(false);

                    for (let child of list) {
                        child.metrics = await api.people.getMetrics(child.path);
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
                        nodeData.tree.children.push(model.createPerson(nodeData, list[n].node, list[n].path, list[n].metrics, "child", n, list.length));
                    }

                    model._adjustPosition();
                }
            };


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

        model.afterRender = () => {
            model.height($(window).height() - 51);

            model._center();
            model.zoomSet(0.8);
        };

        model.zoomSet(0.8);

        model.person = ko.asyncComputed(false, async (setter) => {
            if (!model.nodepath()) {
                return false;
            }

            setter(false);

            let metrics = await api.people.getMetrics(model.nodepath().path);

            return model.createPerson(null, ko.unwrap(model.nodepath().node), model.nodepath().path, metrics, "me", 0, 1);
        }, (error) => {
            stat.printError(error);
            return false;
        });


        return model;
    }

    getTemplate() {
        return (
            <div style={{ overflow: "hidden", position: "relative", backgroundColor: "#eaeaea" }} data-bind="if: person() !== false, style: { height: height() + 'px' }" id="relation-element">
                <div className="relation-container" data-bind="event: { mousedown: startDragHandler, mousemove: dragHandler, mouseup: stopDragHandler, mousewheel: scrollHandler, DOMMouseScroll: scrollHandler }">

                    <div className="relation-zoom-control">
                        <div className="line"></div>
                        <div className="inc" data-bind="click: zoomInc">
                            <div style={{ marginLeft: "1px", marginTop: "2px" }}><i className="material-icons md-14">add</i></div>
                        </div>
                        <div className="mark-container" data-bind="event: { mousedown: startDragMarkHandler }">
                            <div className="mark">
                                <div style={{ marginLeft: "1px", marginTop: "-2px" }}><i className="material-icons md-14">remove</i></div>
                            </div>
                        </div>
                        <div className="dec" data-bind="click: zoomDec">
                            <div style={{ marginLeft: "1px", marginTop: "2px" }}><i className="material-icons md-14">remove</i></div>
                        </div>
                    </div>

                    <div id="relation-canvas" style={{ position: "absolute", top: "0px", left: "0px" }}>
                        <div data-bind="react: { name: 'people-widget-family-person', params: { data: person, zoom: $root.zoom }, if: person, afterRender: afterRender.bind($data) }"></div>
                    </div>
                </div>
            </div>

        );
    }
}

export default PeopleSectionFamily;
