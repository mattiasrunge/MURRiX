
import React, { Fragment } from "react";
import PropTypes from "prop-types";

class StringList extends React.PureComponent {
    render() {
        return (
            <Fragment>
                <For each="child" index="index" of={this.props.children}>
                    {child}
                    <Choose>
                        <When condition={index < this.props.children.length - 2}>
                            {", "}
                        </When>
                        <When condition={index < this.props.children.length - 1}>
                            {" and "}
                        </When>
                    </Choose>
                </For>
            </Fragment>
        );
    }
}

StringList.propTypes = {
    children: PropTypes.node
};

export default StringList;
