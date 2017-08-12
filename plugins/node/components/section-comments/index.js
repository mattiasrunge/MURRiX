
import ko from "knockout";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import CommentWidgetComments from "plugins/comment/components/widget-comments";

class NodeSectionComments extends Component {
    constructor(props) {
        super(props);

        this.state = {
            nodepath: ko.unwrap(props.nodepath)
        };
    }

    componentDidMount() {
        this.addDisposables([
            this.props.nodepath.subscribe((nodepath) => this.setState({ nodepath }))
        ]);
    }

    render() {
        return (
            ﻿<div className="fadeInDown animated node-content">
                <h3>Comments</h3>
                <CommentWidgetComments
                    path={this.state.nodepath.path}
                />
            </div>
        );
    }
}

NodeSectionComments.propTypes = {
    nodepath: PropTypes.any
};

export default NodeSectionComments;
