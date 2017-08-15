
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

class AuthWidgetListGroups extends Component {
    render() {
        return (
            <table className="table table-striped" style={{ fontSize: "12px" }}>
                <tbody>
                    <For each="item" of={this.props.list}>
                        <tr key={item.node._id}>
                            <td style={{ whiteSpace: "nowrap" }}>
                                <strong>
                                    <i className="icon icon-group"></i>
                                    {item.node.attributes.name}
                                </strong>
                            </td>
                            <td>
                                {item.node.attributes.description}
                            </td>
                        </tr>
                    </For>
                </tbody>
            </table>
        );
    }
}

AuthWidgetListGroups.propTypes = {
    list: PropTypes.array.isRequired
};

export default AuthWidgetListGroups;
