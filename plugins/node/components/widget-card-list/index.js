
import ko from "knockout";
import React from "react";
import Component from "lib/component";
import NodeWidgetCard from "plugins/node/components/widget-card";

class NodeWidgetCardList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            list: ko.unwrap(this.props.list)
        };
    }

    componentDidMount() {
        if (ko.isObservable(this.props.list)) {
            this.addDisposables([
                this.props.list.subscribe((list) => this.setState({ list }))
            ]);
        }
    }

    render() {
        return (
            <div className="clearfix" style={{ marginRight: "-15px" }}>
                <For each="item" of={this.state.list}>
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
    list: React.PropTypes.any
};

export default NodeWidgetCardList;
