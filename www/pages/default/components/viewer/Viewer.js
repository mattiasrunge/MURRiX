
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Icon } from "semantic-ui-react";
import { NodeImage } from "components/nodeparts";
import Fullscreen from "./lib/Fullscreen";
import Sidebar from "./lib/Sidebar";
import format from "lib/format";
import ui from "lib/ui";
import api from "api.io-client";

class Viewer extends Component {
    constructor(props) {
        super(props);

        this.state = {
            format: {
                width: 2000,
                type: "image"
            },
            loading: false,
            address: false,
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
            if (node.attributes.where.gps) {
                return node.attributes.where.gps;
            } else if (node.attributes.where.manual) {
                return node.attributes.where.manual;
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

            !this.disposed && this.setState({
                address,
                loading: false
            });
        } catch (error) {
            this.logError("Failed to load node location", error, 10000);
            !this.disposed && this.setState({
                address: false,
                loading: false
            });
        }
    }

    getIndex(offset) {
        let index = this.props.nodes.findIndex((node) => node.path === this.props.path);

        index += offset;

        if (index >= this.props.nodes.length) {
            index = 0;
        } else if (index < 0) {
            index = this.props.nodes.length - 1;
        }

        return index;
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
