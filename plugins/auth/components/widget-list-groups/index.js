
import React from "react";
import Knockout from "components/knockout";
import Comment from "components/comment";

const utils = require("lib/utils");

class AuthWidgetListGroups extends Knockout {
    async getModel() {
        const model = {};

        model.list = this.props.list;


        return model;
    }

    getTemplate() {
        return (
            <table className="table table-striped" style={{ fontSize: "12px" }}>
                <tbody data-bind="foreach: list">
                    <tr>
                        <td style={{ whiteSpace: "nowrap" }}>
                            <strong>
                                <i className="icon icon-group"></i>
                                <span data-bind="text: $data.node.attributes.name"></span>
                            </strong>
                        </td>
                        <td data-bind="text: $data.node.attributes.description"></td>
                    </tr>
                </tbody>
            </table>

        );
    }
}

export default AuthWidgetListGroups;
