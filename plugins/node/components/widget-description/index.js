
import React from "react";
import Component from "lib/component";
import PropTypes from "prop-types";
import NodeWidgetTextAttribute from "plugins/node/components/widget-text-attribute";

class NodeWidgetDescription extends Component {
    render() {
        return (
            <p className="node-widget-description">
                <NodeWidgetTextAttribute
                    nodepath={this.props.nodepath}
                    name="description"
                    html={true}
                />
            </p>
        );
    }
}

NodeWidgetDescription.propTypes = {
    nodepath: PropTypes.any
};

export default NodeWidgetDescription;
