
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import loc from "lib/location";
import stat from "lib/status";
import FileWidgetProfilePicture from "plugins/file/components/widget-profile-picture";

class FeedWidgetNewsPerson extends Component {
    constructor(props) {
        super(props);

        this.state = {
            target: false,
            nodepath: props.nodepath
        };
    }

    componentDidMount() {
        this.load(this.props.nodepath);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.nodepath !== nextProps.nodepath) {
            this.load(this.props.nodepath);
        }
    }

    async load(nodepath) {
        if (!nodepath) {
            return this.setState({ nodepath, target: false });
        }

        try {
            const node = await api.vfs.resolve(nodepath.node.attributes.path, { noerror: true });

            return this.setState({ nodepath, target: node || false });
        } catch (error) {
            stat.printError(error);
            this.setState({ nodepath, target: false });
        }
    }

    onClick(event) {
        event.preventDefault();

        loc.goto({ page: "node", path: this.state.nodepath.node.attributes.path });
    }

    render() {
        return (
            <div>
                <If condition={this.state.nodepath}>
                    <div className="news-media" onClick={(e) => this.onClick(e)} style={{ cursor: "pointer" }}>
                        <FileWidgetProfilePicture
                            size={this.props.size}
                            classes="img-responsive img-fill"
                            responsive={true}
                            path={this.state.nodepath.node.attributes.path}
                        />
                    </div>
                </If>
                <If condition={this.state.target}>
                    <div className="news-name">
                        <a
                            href="#"
                            onClick={(e) => this.onClick(e)}
                        >
                            <h4>{this.state.target.attributes.name}</h4>
                        </a>
                    </div>
                    <If condition={this.state.target.attributes.description}>
                        <div className="news-description text-muted">
                            <p dangerouslySetInnerHTML={{ __html: this.state.target.attributes.description }}></p>
                        </div>
                    </If>
                </If>
            </div>
        );
    }
}

FeedWidgetNewsPerson.defaultProps = {
    size: 600
};

FeedWidgetNewsPerson.propTypes = {
    nodepath: PropTypes.object.isRequired,
    size: PropTypes.number
};

export default FeedWidgetNewsPerson;
