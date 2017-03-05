
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";



class NodeWidgetCardList extends Knockout {
    async getModel() {
        const model = {};

        model.list = this.props.list;


        return model;
    }

    getTemplate() {
        return (
            <div data-bind="foreach: list" className="clearfix" style={{ marginRight: "-15px" }}>
                <div data-bind="react: { name: 'node-widget-card', params: { nodepath: $data } }" className="float-left"></div>
            </div>

        );
    }
}

export default NodeWidgetCardList;
