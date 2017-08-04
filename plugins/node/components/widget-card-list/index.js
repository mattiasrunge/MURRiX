
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import NodeWidgetCard from "plugins/node/components/widget-card";

class NodeWidgetCardList extends Component {
    render() {
        return (
            <div className="clearfix" style={{ marginRight: "-15px" }}>
                <For each="item" of={this.props.list}>
                    <NodeWidgetCard
                        key={item.path}
                        className="float-left"
                        nodepath={item}
                    />
                </For>
            </div>
        );
    }
}

NodeWidgetCardList.propTypes = {
    list: PropTypes.array
};

export default NodeWidgetCardList;
