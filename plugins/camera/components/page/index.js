
import loc from "lib/location";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import stat from "lib/status";
import NodeWidgetPage from "plugins/node/components/widget-page";
import NodeWidgetTextAttribute from "plugins/node/components/widget-text-attribute";
import NodeWidgetSelectAttribute from "plugins/node/components/widget-select-attribute";
import NodeSectionMedia from "plugins/node/components/section-media";

class CameraPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            owners: []
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
            owners: []
        };

        if (!nodepath) {
            return this.setState(state);
        }

        try {
            state.owners = await api.vfs.list(`${nodepath.path}/owners`, { noerror: true });
        } catch (error) {
            stat.printError(error);
        }

        this.setState(state);
    }

    onOwner(event, owner) {
        event.preventDefault();

        loc.goto({ page: "node", path: owner.path });
    }

    render() {
        return (
            <NodeWidgetPage
                nodepath={this.props.nodepath}
                sections={[
                    {
                        name: "media",
                        icon: "photo_library",
                        title: "Media",
                        Element: NodeSectionMedia
                    }
                ]}
                information={[
                    {
                        name: "Type",
                        value: (
                            <NodeWidgetSelectAttribute
                                nodepath={this.props.nodepath}
                                name="type"
                                options={[
                                    {
                                        name: "offset_fixed",
                                        title: "Fixed offset"
                                    },
                                    {
                                        name: "offset_relative_to_position",
                                        title: "Offset relative to the position"
                                    }
                                ]}
                            />
                        )
                    },
                    this.props.nodepath.node.attributes.type === "offset_fixed" &&
                    {
                        name: "Offset UTC",
                        value: (
                            <NodeWidgetTextAttribute
                                nodepath={this.props.nodepath}
                                name="utcOffset"
                            />
                        )
                    },
                    this.props.nodepath.node.attributes.type === "offset_fixed" &&
                    {
                        name: "Offset description",
                        value: (
                            <NodeWidgetTextAttribute
                                nodepath={this.props.nodepath}
                                name="offsetDescription"
                            />
                        )
                    },
                    {
                        name: "Auto DST",
                        value: (
                            <NodeWidgetTextAttribute
                                nodepath={this.props.nodepath}
                                name="deviceAutoDst"
                            />
                        )
                    },
                    {
                        name: "Serial number",
                        value: (
                            <NodeWidgetTextAttribute
                                nodepath={this.props.nodepath}
                                name="serialNumber"
                            />
                        )
                    },
                    {
                        name: "Owners",
                        value: (
                            <div>
                                <For each="item" of={this.state.owners}>
                                    <a
                                        href="#"
                                        style={{ display: "block" }}
                                        onClick={(e) => this.onOwner(e, item)}
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

CameraPage.propTypes = {
    nodepath: PropTypes.object.isRequired
};

export default CameraPage;
