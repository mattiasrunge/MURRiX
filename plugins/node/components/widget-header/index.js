
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import FileWidgetProfilePicture from "plugins/file/components/widget-profile-picture";
import NodeWidgetTextAttribute from "plugins/node/components/widget-text-attribute";
import NodeWidgetDescription from "plugins/node/components/widget-description";
import NodeWidgetLabels from "plugins/node/components/widget-labels";

class NodeWidgetHeader extends Component {
    render() {
        return (
            ﻿<div style={{ display: "table" }}>
                <div style={{ display: "table-cell", padding: "0", verticalAlign: "top" }}>
                    <div className="float-left" style={{ marginRight: "15px" }}>
                        <FileWidgetProfilePicture
                            size="128"
                            path={this.props.nodepath().path}
                            nodepath={this.props.nodepath}
                        />
                    </div>
                </div>
                <div style={{ display: "table-cell", padding: "0", verticalAlign: "top", width: "100%" }}>
                    <h2>
                        <NodeWidgetTextAttribute
                            nodepath={this.props.nodepath}
                            name="name"
                        />
                    </h2>
                    <NodeWidgetDescription
                        nodepath={this.props.nodepath}
                    />
                    <NodeWidgetLabels
                        nodepath={this.props.nodepath}
                    />
                </div>
            </div>

        );
    }
}

NodeWidgetHeader.propTypes = {
    nodepath: PropTypes.func
};

export default NodeWidgetHeader;
