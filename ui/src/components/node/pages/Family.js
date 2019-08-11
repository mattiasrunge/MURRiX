
/* global document */

import React from "react";
import PropTypes from "prop-types";
import { cmd, event } from "lib/backend";
import Component from "lib/component";
import notification from "lib/notification";
import FamilyPerson from "./lib/FamilyPerson";
import theme from "../theme.module.css";

const BOX_WIDTH = 352;
const BOX_HEIGHT = 202;
const BOX_H_MARGIN = 50;
const BOX_V_MARGIN = 10;
const BOX_PADDING = 50;

class Family extends Component {
    constructor(props) {
        super(props);

        this.state = {
            people: [],
            links: [],
            loading: false,
            scale: 1,
            position: { x: 0, y: 0 },
            width: 100,
            height: 100,
            dragging: false
        };
    }

    async load() {
        this.addDisposables([
            event.on("node.update", (path) => {
                if (path.startsWith(this.props.node.path)) {
                    this.update();
                }
            }),
            event.on("node.appendChild", this.onNodeUpdated),
            event.on("node.removeChild", this.onNodeUpdated),
            {
                dispose: () => {
                    document.body.removeEventListener("mousemove", this.onMouseMove);
                    document.body.removeEventListener("mouseup", this.onMouseUp);
                }
            }
        ]);

        await this.update();
    }

    onNodeUpdated = (path) => {
        if (path === this.props.node.path) {
            this.update(this.props);
        }
    }

    makeBox(node, offset, width, level) {
        const parentIds = (node.extra.parents || []).map((parent) => parent._id);
        const childrenIds = (node.extra.children || []).map((child) => child._id);
        delete node.extra.parents; // To enable better GC
        delete node.extra.children; // To enable better GC

        return {
            id: node._id,
            node,
            offset,
            width,
            level,
            parentIds,
            childrenIds,
            location: {
                x: (offset * BOX_WIDTH) + ((width * BOX_WIDTH) / 2) - (BOX_WIDTH / 2),
                y: (level * BOX_HEIGHT) - (BOX_HEIGHT / 2),
                w: BOX_WIDTH - (BOX_V_MARGIN * 2),
                h: BOX_HEIGHT - (BOX_H_MARGIN * 2)
            }
        };
    }

    makeParentRecursive(person, people, offset = 0, level = -1) {
        const parents = person.extra.parents || [];
        let width = 0;

        for (const parent of parents) {
            width += this.makeParentRecursive(parent, people, offset + width, level - 1);
        }

        people.push(this.makeBox(person, offset, width || 1, level));

        return width || 1;
    }

    makeChildRecursive(person, people, offset = 0, level = 1) {
        const children = person.extra.children || [];
        let width = 0;

        for (const child of children) {
            width += this.makeChildRecursive(child, people, offset + width, level + 1);
        }

        people.push(this.makeBox(person, offset, width || 1, level));

        return width || 1;
    }

    makePeople(root) {
        const people = [];
        const parents = root.extra.parents || [];
        const children = root.extra.children || [];
        let parentWidth = 0;
        let childrenWidth = 0;

        for (const parent of parents) {
            parentWidth += this.makeParentRecursive(parent, people, parentWidth);
        }

        for (const child of children) {
            childrenWidth += this.makeChildRecursive(child, people, childrenWidth);
        }

        people.push(this.makeBox(root, 0, Math.max(1, parentWidth, childrenWidth), 0));

        const offsetY = Math.abs(Math.min(...people.map((person) => person.location.y)));

        people.forEach((person) => person.location.y += offsetY);

        const childpeople = people.filter((person) => person.level > 0);
        const parentpeople = people.filter((person) => person.level < 0);

        const realChildrenWidth = Math.max(...childpeople.map((p) => p.location.x + p.location.w));
        const realParentWidth = Math.max(...parentpeople.map((p) => p.location.x + p.location.w));

        const offsetX = (Math.abs(realParentWidth - realChildrenWidth) / 2);

        if (realParentWidth > realChildrenWidth) {
            childpeople.forEach((p) => p.location.x += offsetX);
        } else if (realParentWidth < realChildrenWidth) {
            parentpeople.forEach((p) => p.location.x += offsetX);
        }

        people.forEach((p) => {
            p.location.x += BOX_PADDING;
            p.location.y += BOX_PADDING;
        });

        return people;
    }

    makePath(people, person, id, up) {
        const node = people.find((node) => node.id === id);

        const start = {
            x: person.location.x + (person.location.w / 2),
            y: person.location.y + (person.location.h * (up ? 0 : 1))
        };

        const end = {
            x: node.location.x + (node.location.w / 2),
            y: node.location.y + (person.location.h * (up ? 1 : 0))
        };

        const middle1 = {
            x: start.x,
            y: end.y
        };

        const middle2 = {
            x: end.x,
            y: start.y
        };

        const parts = [];

        parts.push(`M ${start.x} ${start.y}`);
        parts.push(`C ${middle1.x} ${middle1.y},`);
        parts.push(`${middle2.x} ${middle2.y},`);
        parts.push(`${end.x} ${end.y}`);

        return parts.join(" ");
    }

    makeLinks(people) {
        const links = [];

        for (const person of people) {
            for (const id of person.parentIds) {
                links.push(this.makePath(people, person, id, true));
            }

            for (const id of person.childrenIds) {
                links.push(this.makePath(people, person, id, false));
            }
        }

        return links;
    }

    clampPosition(width, height, position) {
        if (width < 1126) {
            position.x = Math.max(0, position.x);
            position.x = Math.min(1126 - width, position.x);
        } else {
            position.x = Math.min(0, position.x);
            position.x = Math.max(1126 - width, position.x);
        }

        if (height < 600) {
            position.y = Math.max(0, position.y);
            position.y = Math.min(600 - height, position.y);
        } else {
            position.y = Math.min(0, position.y);
            position.y = Math.max(600 - height, position.y);
        }

        return position;
    }

    async update() {
        this.setState({ loading: true });

        const position = { x: 0, y: 0 };

        try {
            const root = await cmd.getfamily(this.props.node.path);

            const people = this.makePeople(root);
            const links = this.makeLinks(people);

            const person = people[people.length - 1];

            if (person) {
                position.x = (-(person.location.x + (person.location.w / 2)) * this.state.scale) + (1126 / 2);
                position.y = (-(person.location.y + (person.location.h / 2)) * this.state.scale) + (600 / 2);
            }

            const width = Math.max(...people.map((person) => person.location.x + person.location.w)) + BOX_PADDING;
            const height = Math.max(...people.map((person) => person.location.y + person.location.h)) + BOX_PADDING;

            !this.disposed && this.setState({ position, people, links, loading: false, width, height });
        } catch (error) {
            this.logError("Failed to load family", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ position, people: [], links: [], loading: false, width: 100, height: 100 });
        }
    }

    onContainerRef = (ref) => {
        if (ref) {
            ref.addEventListener("wheel", this.onWheel);
            ref.addEventListener("mousedown", this.onMouseDown);
        }
    }

    onSvgRef = (ref) => {
        this.svg = ref;
    }

    onWheel = (e) => {
        e.stopPropagation();
        e.preventDefault();

        this.setState((state) => {
            const scale = Math.max(1, (state.scale * 10) + (e.deltaY < 0 ? 1 : -1)) / 10;
            const scaleRatio = scale / state.scale;
            const rects = this.svg.getBoundingClientRect();

            const offsetX = e.clientX - rects.x;
            const offsetY = e.clientY - rects.y;

            const newOffsetX = offsetX * scaleRatio;
            const newOffsetY = offsetY * scaleRatio;

            const diffX = newOffsetX - offsetX;
            const diffY = newOffsetY - offsetY;

            const position = {
                x: state.position.x - diffX,
                y: state.position.y - diffY
            };

            const width = state.width * scale;
            const height = state.height * scale;

            return {
                scale,
                position: this.clampPosition(width, height, position)
            };
        });
    }

    onMouseDown = (e) => {
        e.stopPropagation();
        e.preventDefault();

        this.setState((state) => ({ dragging: { x: e.clientX - state.position.x, y: e.clientY - state.position.y } }));

        document.body.removeEventListener("mousemove", this.onMouseMove);
        document.body.removeEventListener("mouseup", this.onMouseUp);
        document.body.addEventListener("mousemove", this.onMouseMove);
        document.body.addEventListener("mouseup", this.onMouseUp);
    }

    onMouseMove = (e) => {
        e.stopPropagation();
        e.preventDefault();

        if (!this.state.dragging) {
            return;
        }

        this.setState((state) => {
            const position = {
                x: e.clientX - state.dragging.x,
                y: e.clientY - state.dragging.y
            };

            const width = state.width * state.scale;
            const height = state.height * state.scale;

            return {
                position: this.clampPosition(width, height, position)
            };
        });
    }

    onMouseUp = (e) => {
        e.stopPropagation();
        e.preventDefault();

        this.setState(() => ({ dragging: false }));

        document.body.removeEventListener("mousemove", this.onMouseMove);
        document.body.removeEventListener("mouseup", this.onMouseUp);
    }

    render() {
        return (
            <If condition={this.state.people.length > 0}>
                <div className={theme.familyContainer} ref={this.onContainerRef}>
                    <svg
                        ref={this.onSvgRef}
                        width={this.state.width * this.state.scale}
                        height={this.state.height * this.state.scale}
                        style={{
                            backgroundColor: "white",
                            transform: `translate(${this.state.position.x}px,${this.state.position.y}px)`
                        }}
                    >
                        <g
                            style={{
                                transform: `scale(${this.state.scale})`
                            }}
                        >
                            <For each="link" of={this.state.links}>
                                <path
                                    key={link}
                                    d={link}
                                    strokeWidth={2}
                                    stroke="#d4d4d5"
                                    fill="transparent"
                                />
                            </For>
                            <For each="person" of={this.state.people}>
                                <foreignObject
                                    key={person.id}
                                    x={person.location.x}
                                    y={person.location.y}
                                    width={person.location.w}
                                    height={person.location.h}
                                >
                                    <FamilyPerson person={person} />
                                </foreignObject>
                            </For>
                        </g>
                    </svg>
                </div>
            </If>
        );
    }
}

Family.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Family;
