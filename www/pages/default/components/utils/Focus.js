
import React from "react";
import PropTypes from "prop-types";
import { Ref } from "semantic-ui-react";

class Focus extends React.PureComponent {
    focus() {
        setTimeout(() => this.ref && this.ref.focus(), 100);
    }

    select() {
        setTimeout(() => this.ref && this.ref.select(), 150);
    }

    onRef(ref) {
        if (ref) {
            this.ref = ref.getElementsByTagName("INPUT")[0] || ref.getElementsByTagName("TEXTAREA")[0];
            this.focus();
            this.props.select && this.select();
        } else {
            this.ref = null;
        }
    }

    render() {
        return (
            <Ref innerRef={(ref) => this.onRef(ref)}>
                {this.props.children}
            </Ref>
        );
    }
}

Focus.propTypes = {
    children: PropTypes.node,
    select: PropTypes.bool
};

export default Focus;
