
import ko from "knockout";
import loc from "lib/location";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import stat from "lib/status";
import NodeWidgetPage from "plugins/node/components/widget-page";
import NodeWidgetTextAttribute from "plugins/node/components/widget-text-attribute";

class LocationPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            position: false,
            residents: []
        };
    }

    componentDidMount() {
        this.addDisposables([
            this.props.nodepath.subscribe((np) => this.load(np))
        ]);

        this.load(ko.unwrap(this.props.nodepath));
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.nodepath !== nextProps.nodepath) {
            this.load(ko.unwrap(nextProps.nodepath));
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

        const node = ko.unwrap(nodepath.node);

        if (!node) {
            return this.setState(state);
        }

        if (node && node.attributes.address) {
            try {
                state.position = await api.lookup.getPositionFromAddress(node.attributes.address.replace("<br>", "\n"));
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
                        react: "location-section-map"
                    },
                    {
                        name: "media",
                        icon: "photo_library",
                        title: "Media",
                        react: "node-section-media"
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
    nodepath: PropTypes.func
};

export default LocationPage;
