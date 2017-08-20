
import loc from "lib/location";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import stat from "lib/status";
import NodeWidgetPage from "plugins/node/components/widget-page";
import NodeWidgetTextAttribute from "plugins/node/components/widget-text-attribute";
import LocatationSectionMap from "plugins/location/components/section-map";
import NodeSectionMedia from "plugins/node/components/section-media";

class LocationPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            position: false,
            residents: []
        };
    }

    componentDidMount() {
        this.load(this.props.nodepath);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.nodepath !== this.props.nodepath) {
            this.load(nextProps.nodepath);
        }
    }

    async load(nodepath) {
        const state = {
            position: false,
            residents: []
        };

        if (!nodepath) {
            return this.setState(state);
        }

        if (nodepath.node.attributes.address) {
            try {
                state.position = await api.lookup.getPositionFromAddress(nodepath.node.attributes.address.replace("<br>", "\n"));
            } catch (error) {
                stat.printError(error);
            }
        }

        try {
            state.residents = await api.vfs.list(`${nodepath.path}/residents`, { noerror: true });
        } catch (error) {
            stat.printError(error);
        }

        this.setState(state);
    }

    onResident(event, resident) {
        event.preventDefault();

        loc.goto({ page: "node", path: resident.path });
    }

    render() {
        return (
            <NodeWidgetPage
                nodepath={this.props.nodepath}
                sections={[
                    {
                        name: "map",
                        icon: "location_on",
                        title: "Map",
                        Element: LocatationSectionMap
                    },
                    {
                        name: "media",
                        icon: "photo_library",
                        title: "Media",
                        Element: NodeSectionMedia
                    }
                ]}
                information={[
                    {
                        name: "Address",
                        value: (
                            <NodeWidgetTextAttribute
                                nodepath={this.props.nodepath}
                                name="address"
                            />
                        )
                    },
                    {
                        name: "Longitude",
                        value: this.state.position.longitude || "No value"
                    },
                    {
                        name: "Latitude",
                        value: this.state.position.latitude || "No value"
                    },
                    {
                        name: "Residents",
                        value: (
                            <div>
                                <For each="item" of={this.state.residents}>
                                    <a
                                        key={item.path}
                                        href="#"
                                        style={{ display: "block" }}
                                        onClick={(e) => this.onResident(e, item)}
                                    >
                                        {item.node.attributes.name}
                                    </a>
                                </For>
                            </div>
                        )
                    }
                ]}
            />
        );
    }
}

LocationPage.propTypes = {
    nodepath: PropTypes.object.isRequired
};

export default LocationPage;
