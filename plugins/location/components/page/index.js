
import loc from "lib/location";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import AsyncComponent from "lib/async_component";
import stat from "lib/status";
import NodeWidgetPage from "plugins/node/components/widget-page";
import NodeWidgetTextAttribute from "plugins/node/components/widget-text-attribute";
import LocatationSectionMap from "plugins/location/components/section-map";
import NodeSectionMedia from "plugins/node/components/section-media";

class LocationPage extends AsyncComponent {
    getInitialState() {
        return { position: false, residents: [] };
    }

    onLoadError(error) {
        stat.printError(error);

        return { position: false, residents: [] };
    }

    async load(props, w) {
        if (!props.nodepath) {
            return { position: false, residents: [] };
        }

        const state = { position: false, residents: [] };

        if (props.nodepath.node.attributes.address) {
            state.position = await w(api.lookup.getPositionFromAddress(props.nodepath.node.attributes.address.replace("<br>", "\n")));
        }

        state.residents = await w(api.vfs.list(`${props.nodepath.path}/residents`, { noerror: true }));

        return state;
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
