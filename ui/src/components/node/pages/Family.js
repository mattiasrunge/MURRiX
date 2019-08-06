
import React from "react";
import PropTypes from "prop-types";
import Draggable from "react-draggable";
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
            scale: 0.5,
            position: { x: 0, y: 0 },
            width: 100,
            height: 100
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
            event.on("node.removeChild", this.onNodeUpdated)
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

    async update() {
        this.setState({ loading: true });

        const position = { x: 0, y: 0 };

        try {
            const root = await cmd.getfamily(this.props.node.path);

            const people = this.makePeople(root);
            const links = this.makeLinks(people);

            const person = people[people.length - 1];

            // if (person) {
            //     position.x = -(person.location.x + (person.location.w / 2)) + (1126 / 2);
            //     position.y = -(person.location.y + (person.location.h / 2)) + (600 / 2);
            // }

            const width = Math.max(...people.map((person) => person.location.x + person.location.w)) + BOX_PADDING;
            const height = Math.max(...people.map((person) => person.location.y + person.location.h)) + BOX_PADDING;

            // position.x = (width - 1126) / 2;
            // position.y = (height - 600) / 2;

            !this.disposed && this.setState({ position, people, links, loading: false, width, height });
        } catch (error) {
            this.logError("Failed to load family", error);
            notification.add("error", error.message, 10000);
            !this.disposed && this.setState({ position, people: [], links: [], loading: false, width: 100, height: 100 });
        }
    }

    onRef = (ref) => {
        if (ref) {
            ref.addEventListener("wheel", (event) => {
                event.stopPropagation();
                event.preventDefault();

                console.log(event)

                this.setState((state) => {
                    console.log("state.position", state.position);
                    const currentScale = Math.round(state.scale * 10);
                    const currentPosition = {
                        x: Math.round(state.position.x * 10),
                        y: Math.round(state.position.y * 10)
                    };

                    const scale = Math.max(1, currentScale + (event.deltaY < 0 ? 1 : -1));
                    console.log("scale", currentScale, "=>", scale)



console.log("layer", event.layerX, event.layerY)
                    const offsetX = event.layerX - state.position.x;
                    const offsetY = event.layerY - state.position.y;

                    const moveX = offsetX * (1 - (scale / 10));
                    const moveY = offsetY * (1 - (scale / 10));

                    // const offsetXScaled = offsetX * scale;
                    // const offsetYScaled = offsetY * scale;

                    // const diffY = offsetYScaled - offsetY;
                    // const diffX = offsetXScaled - offsetX;

                    console.log("offset", moveX, moveY)
                    // console.log("offsetScaled", offsetXScaled, offsetYScaled)
                    // console.log("diff", diffX, diffY)

                    // const position = {
                    //     x: currentPosition.x - diffX,
                    //     y: currentPosition.y - diffY
                    // };

                    // console.log("position", position);

                    return {
                        scale: scale / 10,
                        // position: {
                        //     x: state.position.x - moveX,
                        //     y: state.position.y - moveY
                        // }
                    };
                });
            });
        }
    }

    onDrag = (e, { x, y }) => {
        this.setState({
            position: { x, y }
        });
    }

    render() {
        return (
            <If condition={this.state.people.length > 0}>
                <div className={theme.familyContainer}>
                    <Draggable
                        position={this.state.position}
                        grid={[ 1, 1 ]}
                        onDrag={this.onDrag}
                    >
                        <svg
                            width={this.state.width * this.state.scale}
                            height={this.state.height * this.state.scale}
                            ref={this.onRef}
                            style={{
                                backgroundColor: "white"
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
                                        <FamilyPerson
                                            person={person}
                                        />
                                    </foreignObject>
                                </For>
                            </g>
                        </svg>
                    </Draggable>
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
