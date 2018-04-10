
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import { Image, Visibility } from "semantic-ui-react";
import NodeIcon from "./NodeIcon";

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
            api.vfs.on("node.create", (path) => {
                if (path === this.props.path) {
                    this.update(this.props);
                }
            }),
            api.vfs.on("node.update", (path) => {
                if (path === this.props.path) {
                    this.update(this.props);
                }
            })
        ]);

        !this.props.lazy && (await this.update(this.props));
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.path !== nextProps.path || JSON.stringify(this.props.format) !== JSON.stringify(nextProps.format)) {
            this.update(nextProps);
        }
    }

    async update(props) {
        this.setState({ url: null, loading: true, failed: false });

        try {
            const url = await api.vfs.media(props.path, props.format);

            !this.disposed && this.setState({ url, loading: false });
        } catch (error) {
            // this.logError("Failed to get node url", error, 10000);
            !this.disposed && this.setState({ loading: false, failed: true });
        }
    }

    onVisible = () => {
        if (this.state.loading || this.state.url || this.state.failed) {
            return;
        }

        this.update(this.props);
    }

    render() {
        if (!this.state.url && this.props.type) {
            return (
                <NodeIcon
                    theme={this.props.theme}
                    className={this.props.className}
                    title={this.props.title}
                    type={this.props.type}
                    size={this.props.size}
                />
            );
        }

        const url = this.state.url || "/pixel.jpg";

        return (
            <Visibility
                as="span"
                onTopVisible={this.onVisible}
                onBottomVisible={this.onVisible}
                onTopPassed={this.onVisible}
                onBottomPassed={this.onVisible}
                onOnScreen={this.onVisible}
                fireOnMount
            >
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
                    style={{
                        width: this.props.format.width,
                        height: this.props.format.height
                    }}
                />
            </Visibility>
        );
    }
}

NodeImage.propTypes = {
    theme: PropTypes.object,
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
    lazy: PropTypes.bool
};

export default NodeImage;
