
import React from "react";
import PropTypes from "prop-types";
import { Ref } from "semantic-ui-react";

class Focus extends React.PureComponent {
    focus() {
        setTimeout(() => this.ref && this.ref.focus(), 100);
    }

    onRef(ref) {
        if (ref) {
            this.ref = ref.getElementsByTagName("INPUT")[0] || ref.getElementsByTagName("TEXTAREA")[0];
            this.focus();
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
    children: PropTypes.node
};

export default Focus;
