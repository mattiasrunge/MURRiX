
import ko from "knockout";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

const types = {
    "a": "album",
    "l": "location",
    "p": "person",
    "c": "camera",
    "d": "directory",
    "f": "file",
    "s": "symlink",
    "k": "comment",
    "r": "root"
};

class NodeWidgetType extends Component {
    constructor(props) {
        super(props);

        this.state = {
            type: ko.unwrap(this.props.type)
        };
    }

    componentDidMount() {
        if (ko.isObservable(this.props.type)) {
            this.addDisposables([
                this.props.type.subscribe((type) => this.setState({ type }))
            ]);
        }
    }

    render() {
        return (
            <span>{types[this.state.type] || "unknown"}</span>
        );
    }
}

NodeWidgetType.propTypes = {
    type: PropTypes.any
};

export default NodeWidgetType;
