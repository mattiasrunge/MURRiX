
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import loc from "lib/location";
import stat from "lib/status";
import Map from "components/map";

class FeedWidgetNewsLocation extends Component {
    constructor(props) {
        super(props);

        this.state = {
            target: false,
            position: false,
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
            return this.setState({ nodepath, target: false, position: false });
        }

        try {
            const node = await api.vfs.resolve(nodepath.node.attributes.path, { noerror: true });

            if (!node || !node.attributes.address) {
                return this.setState({ nodepath, target: false, position: false });
            }

            const location = await api.lookup.getPositionFromAddress(node.attributes.address.replace("<br>", "\n"));
            const position = {
                lat: location.latitude,
                lng: location.longitude
            };

            return this.setState({ nodepath, target: node, position });
        } catch (error) {
            stat.printError(error);
            this.setState({ nodepath, target: false, position: false });
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
                        <If condition={this.state.position}>
                            <div style={{ height: 350, position: "relative" }}>
                                <Map
                                    style={{ width: "100%", height: "100%" }}
                                    initialCenter={this.state.position}
                                    zoom={15}
                                    disableDefaultUI={true}
                                    disableDoubleClickZoom={true}
                                    gestureHandling="none"
                                    clickableIcons={false}
                                    keyboardShortcuts={false}
                                >
                                </Map>
                            </div>
                        </If>
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

FeedWidgetNewsLocation.propTypes = {
    nodepath: PropTypes.object.isRequired
};

export default FeedWidgetNewsLocation;
