
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import api from "api.io-client";
import { Image } from "semantic-ui-react";
import NodeIcon from "./NodeIcon";

class NodeImage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            url: null,
            loading: false
        };
    }

    async load() {
        await this.update(this.props);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.path !== nextProps.path || JSON.stringify(this.props.format) !== JSON.stringify(nextProps.format)) {
            this.update(nextProps);
        }
    }

    async update(props) {
        this.setState({ url: null, loading: true });

        try {
            const url = await api.vfs.media(props.path, props.format);

            !this.disposed && this.setState({ url, loading: false });
        } catch (error) {
            // this.logError("Failed to get node url", error, 10000);
            !this.disposed && this.setState({ loading: false });
        }
    }

    render() {
        if (!this.state.url && this.props.type) {
            return (
                <NodeIcon
                    theme={this.props.theme}
                    type={this.props.type}
                    size={this.props.size}
                />
            );
        }

        const url = this.state.url || "/pixel.jpg";

        return (
            <Image
                className={this.props.className}
                src={url}
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
            />
        );
    }
}

NodeImage.propTypes = {
    theme: PropTypes.object,
    className: PropTypes.string,
    path: PropTypes.string.isRequired,
    type: PropTypes.string,
    format: PropTypes.object.isRequired,
    avatar: PropTypes.bool,
    bordered: PropTypes.bool,
    centered: PropTypes.bool,
    circular: PropTypes.bool,
    floated: PropTypes.string,
    inline: PropTypes.bool,
    fluid: PropTypes.bool,
    rounded: PropTypes.bool,
    size: PropTypes.bool,
    spaced: PropTypes.any,
    verticalAlign: PropTypes.string,
    wrapped: PropTypes.bool
};

export default NodeImage;
