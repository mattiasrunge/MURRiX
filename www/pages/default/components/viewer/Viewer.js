
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Icon } from "semantic-ui-react";
import { NodeImage } from "components/nodeparts";
import Fullscreen from "./lib/Fullscreen";
import Sidebar from "./lib/Sidebar";
import format from "lib/format";
import ui from "lib/ui";
import utils from "lib/utils";
import CircularList from "lib/circular_list";
import api from "api.io-client";

class Viewer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            address: false,
            tags: [],
            sidebar: true,
            slideshow: false
        };
    }

    async load() {
        this.addDisposables([
            ui.shortcut("right", this.onNext),
            ui.shortcut("left", this.onPrevious)
        ]);

        await this.update(this.props);
    }

    componentDidUpdate(prevProps) {
        if (this.props.path !== prevProps.path) {
            this.update(prevProps);
        }
    }

    getPosition(node) {
        if (node.attributes.where) {
            if (node.attributes.where.manual) {
                return node.attributes.where.manual;
            } else if (node.attributes.where.gps) {
                return node.attributes.where.gps;
            }
        }

        return false;
    }

    async update(props) {
        this.setState({ loading: true });

        const node = props.nodes.find((node) => node.path === props.path);

        try {
            let address = false;
            const position = this.getPosition(node);
            const location = await api.vfs.resolve(`${node.path}/location`, { noerror: true });

            if (location) {
                address = location.attributes.address;
            } else if (position) {
                address = await api.vfs.position2address(position.longitude, position.latitude);
            }

            const tagNodes = await api.vfs.list(`${node.path}/tags`, { noerror: true });

            const tags = tagNodes
            .map((tagNode) => {
                const face = (node.attributes.faces || []).find((face) => utils.basename(tagNode.extra.linkPath) === face.id);

                if (!face) {
                    return false;
                }

                return {
                    left: `${(face.x - (face.w / 2)) * 100}%`,
                    top: `${(face.y - (face.h / 2)) * 100}%`,
                    width: `${face.w * 100}%`,
                    height: `${face.h * 100}%`,
                    text: tagNode.attributes.name,
                    id: tagNode._id
                };
            })
            .filter((item) => item);

            !this.disposed && this.setState({
                address,
                tags,
                loading: false
            });
        } catch (error) {
            this.logError("Failed to load node location", error, 10000);
            !this.disposed && this.setState({
                address: false,
                tags: [],
                loading: false
            });
        }
    }

    getIndex(offset) {
        const list = new CircularList(this.props.nodes);

        return list
        .select((node) => node.path === this.props.path)
        .offset(offset)
        .index;
    }

    goto(offset) {
        const index = this.getIndex(offset);

        this.props.onSelect(this.props.nodes[index]);
    }

    onNext = () => {
        this.goto(1);
    }

    onPrevious = () => {
        this.goto(-1);
    }

    onClose = () => {
        this.props.onSelect(false);
    }

    onShowSidebar = () => {
        this.setState({ sidebar: true });
    }

    onHideSidebar = () => {
        this.setState({ sidebar: false });
    }

    onToggleSidebar = () => {
        this.setState((state) => ({ sidebar: !state.sidebar }));
    }

    onStartSlideshow = () => {
        const node = this.props.nodes[this.getIndex(0)];

        if (node.attributes.type === "video" || node.attributes.type === "audio") {
            this.setState({ slideshow: true });
        } else {
            this.setState({
                slideshow: setInterval(this.onNext, 3000)
            });
        }
    }

    onStopSlideshow = () => {
        if (this.state.slideshow) {
            clearInterval(this.state.slideshow);
            this.setState({ slideshow: false });
        }
    }

    onMediaStarted = () => {
        if (this.state.slideshow) {
            clearInterval(this.state.slideshow);
            this.setState({ slideshow: true });
        }
    }

    onMediaEnded = () => {
        if (this.state.slideshow) {
            this.onNext();

            this.setState({
                slideshow: setInterval(this.onNext, 3000)
            });
        }
    }

    render() {
        const index = this.getIndex(0);
        const node = this.props.nodes[index];
        const nextNode = this.props.nodes[this.getIndex(1)];
        const previousNode = this.props.nodes[this.getIndex(-1)];

        const classNames = this.classNames(this.props.theme.contentContainer, this.state.sidebar && !this.state.slideshow ? null : this.props.theme.contentContainerLarge);

        return (
            <Fullscreen theme={this.props.theme}>
                <div className={classNames} onClick={this.onStopSlideshow}>
                    <div className={this.props.theme.mediaContainer}>
                        <div className={this.props.theme.mediaWrapper}>
                            <NodeImage
                                className={this.props.theme.media}
                                title={node.attributes.name}
                                path={node.path}
                                format={{
                                    type: node.attributes.type,
                                    width: node.attributes.type === "image" ? 2000 : null
                                }}
                                lazy={false}
                                onStarted={this.onMediaStarted}
                                onEnded={this.onMediaEnded}
                            />

                            <For each="tag" of={this.state.tags}>
                                <div
                                    key={tag.id}
                                    className={this.props.theme.tagFrame}
                                    style={{
                                        left: tag.left,
                                        top: tag.top,
                                        width: tag.width,
                                        height: tag.height
                                    }}
                                >
                                    <div className={this.props.theme.tagLabel}>
                                        <span className={this.props.theme.tagLabelText}>
                                            {tag.text}
                                        </span>
                                    </div>
                                </div>
                            </For>
                        </div>
                    </div>

                    <div className={this.props.theme.infoContainer}>
                        <If condition={!this.state.slideshow}>
                            <Icon
                                className={this.props.theme.mediaLeft}
                                link
                                fitted
                                size="big"
                                name="arrow left"
                                onClick={this.onPrevious}
                            />
                        </If>
                        <div className={this.props.theme.infoContent}>
                            <span className={this.props.theme.infoItem}>
                                <Icon name="image outline" />
                                {index + 1} of {this.props.nodes.length}
                                <Choose>
                                    <When condition={!this.state.slideshow}>
                                        <Icon
                                            className={this.props.theme.slideshowButton}
                                            name="play"
                                            title="Start slideshow"
                                            link
                                            fitted
                                            onClick={this.onStartSlideshow}
                                        />
                                    </When>
                                    <Otherwise>
                                        <Icon
                                            className={this.props.theme.slideshowButton}
                                            name="stop"
                                            title="Stop slideshow"
                                            link
                                            fitted
                                            onClick={this.onStopSlideshow}
                                        />
                                    </Otherwise>
                                </Choose>
                            </span>
                            <span className={this.props.theme.infoItem}>
                                <Icon name="clock outline" />
                                {format.displayTime(node.attributes.time)}
                            </span>
                            <span className={this.props.theme.infoItem}>
                                <Icon name="map marker alternate" />
                                {this.state.address || "Unknown"}
                            </span>
                        </div>
                        <If condition={!this.state.slideshow}>
                            <Icon
                                className={this.props.theme.mediaRight}
                                link
                                fitted
                                size="big"
                                name="arrow right"
                                onClick={this.onNext}
                            />
                        </If>
                    </div>

                    <If condition={!this.state.slideshow}>
                        <div
                            className={this.props.theme.sidebarToggle}
                            onClick={this.onToggleSidebar}
                            title={this.state.sidebar ? "Hide sidebar" : "Show sidebar"}
                        >
                            <If condition={this.state.sidebar}>
                                <Icon
                                    className={this.props.theme.sidebarToggleIcon}
                                    link
                                    fitted
                                    size="large"
                                    name="angle right"
                                />
                            </If>
                            <If condition={!this.state.sidebar}>
                                <Icon
                                    className={this.props.theme.sidebarToggleIcon}
                                    link
                                    fitted
                                    size="large"
                                    name="angle left"
                                />
                            </If>
                        </div>
                    </If>
                </div>

                <If condition={!this.state.slideshow}>
                    <Icon
                        className={this.props.theme.closeIcon}
                        link
                        fitted
                        size="big"
                        name="close"
                        onClick={this.onClose}
                    />

                    <If condition={this.state.sidebar}>
                        <Sidebar
                            theme={this.props.theme}
                            node={node}
                            onClose={this.onClose}
                        />
                    </If>
                </If>

                <NodeImage
                    path={nextNode.path}
                    format={{
                        type: nextNode.attributes.type,
                        width: nextNode.attributes.type === "image" ? 2000 : null
                    }}
                    lazy={false}
                    autoPlay={false}
                    style={{ display: "none" }}
                />
                <NodeImage
                    path={previousNode.path}
                    format={{
                        type: previousNode.attributes.type,
                        width: previousNode.attributes.type === "image" ? 2000 : null
                    }}
                    lazy={false}
                    autoPlay={false}
                    style={{ display: "none" }}
                />
            </Fullscreen>
        );
    }
}

Viewer.propTypes = {
    theme: PropTypes.object,
    path: PropTypes.string.isRequired,
    nodes: PropTypes.array.isRequired,
    onSelect: PropTypes.func.isRequired
};

export default Viewer;
