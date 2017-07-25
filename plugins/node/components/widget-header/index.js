
import React from "react";
import Component from "lib/component";
import WidgetProfilePicture from "plugins/file/components/widget-profile-picture";
import WidgetTextAttribute from "plugins/node/components/widget-text-attribute";
import WidgetDescription from "plugins/node/components/widget-description";
import WidgetLabels from "plugins/node/components/widget-labels";

class NodeWidgetHeader extends Component {
    render() {
        return (
            ﻿<div style={{ display: "table" }}>
                <div style={{ display: "table-cell", padding: "0", verticalAlign: "top" }}>
                    <div className="float-left" style={{ marginRight: "15px" }}>
                        <WidgetProfilePicture
                            size="128"
                            path={this.props.nodepath().path}
                            />
                    </div>
                </div>
                <div style={{ display: "table-cell", padding: "0", verticalAlign: "top", width: "100%" }}>
                    <h2>
                        <WidgetTextAttribute
                            nodepath={this.props.nodepath}
                            name="name"
                        />
                    </h2>
                    <WidgetDescription
                        nodepath={this.props.nodepath}
                    />
                    <WidgetLabels
                        nodepath={this.props.nodepath}
                    />
                </div>
            </div>

        );
    }
}

NodeWidgetHeader.propTypes = {
    nodepath: React.PropTypes.object
};

export default NodeWidgetHeader;
