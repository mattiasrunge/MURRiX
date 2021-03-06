
import React from "react";
import PropTypes from "prop-types";
import { Image, Segment } from "semantic-ui-react";
import Component from "lib/component";
import { backend, api, event } from "lib/backend";
import NodeIcon from "./NodeIcon";
import theme from "./theme.module.css";

class NodeImage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            url: null,
            loading: false,
            failed: false
        };
    }

    async load() {
        this.addDisposables([
            event.on("node.create", this.onNodeUpdated),
            event.on("node.update", this.onNodeUpdated)
        ]);

        await this.update(this.props);
    }

    onNodeUpdated = (event, { path }) => {
        if (path === this.props.path) {
            this.update(this.props);
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.path !== prevProps.path || JSON.stringify(this.props.format) !== JSON.stringify(prevProps.format)) {
            this.update(this.props, this.props.path !== prevProps.path);
        }
    }

    async update(props, newPath) {
        const state = { loading: true, failed: false };

        if (newPath) {
            state.url = null;
        }

        this.setState(state);

        const loadId = this._loadId = Date.now();

        try {
            const url = await api.url(props.path, props.format);

            if (loadId !== this._loadId) {
                return;
            }

            (this.props.autoPlay && this.props.onStarted && (this.props.format.type === "video" || this.props.format.type === "audio")) && this.props.onStarted();

            !this.disposed && this.setState({ url, loading: false });
        } catch (error) {
            this.logError("Failed to get node url", error, 10000);
            !this.disposed && this.setState({ url: null, loading: false, failed: true });
        }
    }

    render() {
        if (!this.state.url && this.props.type) {
            return (
                <NodeIcon
                    theme={theme}
                    className={this.props.className}
                    title={this.props.title}
                    type={this.props.type}
                    size={this.props.size}
                />
            );
        }

        const url = this.state.url ? `${backend.getAddress()}${this.state.url}` : "/pixel.jpg";
        const style = Object.assign({}, this.props.style);

        // If we have exact constraints we can set it to that size
        // before it has loaded, if not we will not be able to do that.
        if (!this.props.noFixedSize && this.props.format.width && this.props.format.height) {
            style.width = this.props.format.width;
            style.height = this.props.format.height;
        }

        if (!this.props.lazy) {
            if (this.props.format.type === "image") {
                return (
                    <Image
                        className={this.props.className}
                        src={url}
                        title={this.props.title}
                        avatar={this.props.avatar}
                        bordered={this.props.bordered}
                        centered={this.props.centered}
                        circular={this.props.circular}
                        floated={this.props.floated}
                        inline={this.props.inline}
                        fluid={this.props.fluid}
                        rounded={this.props.rounded}
                        size={this.props.size}
                        spaced={this.props.spaced}
                        verticalAlign={this.props.verticalAlign}
                        wrapped={this.props.wrapped}
                        style={style}
                        draggable="false"
                    />
                );
            } else if (this.props.format.type === "video") {
                return (
                    <video
                        autoPlay={this.props.autoPlay}
                        controls
                        preload="metadata"
                        title={this.props.title}
                        className={this.props.className}
                        style={style}
                        src={url}
                        type="video/webm"
                        onEnded={this.props.onEnded}
                    />
                );
            } else if (this.props.format.type === "audio") {
                return (
                    <audio
                        autoPlay={this.props.autoPlay}
                        controls
                        preload="metadata"
                        title={this.props.title}
                        className={this.props.className}
                        style={Object.assign({}, style, { width: "80%", minWidth: 600 })}
                        src={url}
                        type="video/webm"
                        onEnded={this.props.onEnded}
                    />
                );
            }

            return (
                <Segment
                    style={Object.assign({}, style, {
                        width: "100%",
                        height: "100%"
                    })}
                    className={this.props.className}
                >
                    File type can not be displayed
                </Segment>
            );
        }

        return (
            <Image
                loading={this.props.lazy ? "lazy" : "auto"}
                className={this.props.className}
                src={url}
                title={this.props.title}
                avatar={this.props.avatar}
                bordered={this.props.bordered}
                centered={this.props.centered}
                circular={this.props.circular}
                floated={this.props.floated}
                inline={this.props.inline}
                fluid={this.props.fluid}
                rounded={this.props.rounded}
                size={this.props.size}
                spaced={this.props.spaced}
                verticalAlign={this.props.verticalAlign}
                wrapped={this.props.wrapped}
                style={style}
                draggable="false"
            />
        );
    }
}

NodeImage.defaultProps = {
    autoPlay: true,
    style: {}
};

NodeImage.propTypes = {
    className: PropTypes.string,
    path: PropTypes.string.isRequired,
    type: PropTypes.string,
    title: PropTypes.string,
    format: PropTypes.object.isRequired,
    avatar: PropTypes.bool,
    bordered: PropTypes.bool,
    centered: PropTypes.bool,
    circular: PropTypes.bool,
    floated: PropTypes.string,
    inline: PropTypes.bool,
    fluid: PropTypes.bool,
    rounded: PropTypes.bool,
    size: PropTypes.string,
    spaced: PropTypes.any,
    verticalAlign: PropTypes.string,
    wrapped: PropTypes.bool,
    lazy: PropTypes.bool,
    noFixedSize: PropTypes.bool,
    autoPlay: PropTypes.bool,
    style: PropTypes.object,
    onStarted: PropTypes.func,
    onEnded: PropTypes.func
};

export default NodeImage;
