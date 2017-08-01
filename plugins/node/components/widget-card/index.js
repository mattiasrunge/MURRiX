
import loc from "lib/location";
import ko from "knockout";
import React from "react";
import Component from "lib/component";
import FileWidgetProfilePicture from "plugins/file/components/widget-profile-picture";
import NodeWidgetDescription from "plugins/node/components/widget-description";
import NodeWidgetLabels from "plugins/node/components/widget-labels";

class NodeWidgetCard extends Component {
    constructor(props) {
        super(props);

        this.state = {
            nodepath: props.nodepath,
            node: ko.unwrap(props.nodepath).node
        };
    }

    onClick(event) {
        event.preventDefault();
        loc.goto({ page: "node", path: this.state.nodepath.path, section: null });
    }

    render() {
        const node = ko.unwrap(this.state.nodepath.node);

        return (
            <div
                className={`node-item-panel ${this.props.className}`}
                style={{ width: "296px" }}
                onClick={(e) => this.onClick(e)}
            >
                <If condition={this.state.nodepath}>
                    <div style={{ position: "relative", height: "303px" }}>
                        <FileWidgetProfilePicture
                            size="303"
                            path={this.state.nodepath.path}
                            nodepath={this.state.nodepath}
                        />

                        <div className="title-text">
                            <i className="material-icons md-18">
                                <Choose>
                                    <When condition={node.properties.type === "a"}>
                                        photo_album
                                    </When>
                                    <When condition={node.properties.type === "p"}>
                                        person
                                    </When>
                                    <When condition={node.properties.type === "l"}>
                                        location_on
                                    </When>
                                    <When condition={node.properties.type === "c"}>
                                        photo_camera
                                    </When>
                                </Choose>
                            </i>
                            {" "}
                            {node.attributes.fullname ? node.attributes.fullname : node.attributes.name}
                        </div>
                    </div>
                    <div style={{ padding: "15px" }}>
                        <NodeWidgetDescription
                            nodepath={ko.observable(this.props.nodepath)}
                        />
                        <NodeWidgetLabels
                            nodepath={ko.observable(this.props.nodepath)}
                        />
                    </div>
                </If>
            </div>
        );
    }
}

NodeWidgetCard.defaultProps = {
    className: ""
};

NodeWidgetCard.propTypes = {
    className: React.PropTypes.string,
    nodepath: React.PropTypes.any
};

export default NodeWidgetCard;
