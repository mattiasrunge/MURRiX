
import React from "react";
import PropTypes from "prop-types";
import { Ref } from "semantic-ui-react";

class Focus extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            rendered: false
        };
    }

    componentDidUpdate() {
        this.setState({
            rendered: true
        });
    }

    focus() {
        setTimeout(() => this.ref && this.ref.focus(), 100);
    }

    select() {
        setTimeout(() => this.ref && this.ref.select(), 150);
    }

    onRef(ref) {
        if (this.state.rendered) {
            return;
        }

        if (ref) {
            this.ref = ref.querySelector("input") || ref.querySelector("textarea");
            this.props.focus && this.focus();
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

Focus.defaultProps = {
    focus: true
};

Focus.propTypes = {
    children: PropTypes.node,
    select: PropTypes.bool,
    focus: PropTypes.bool
};

export default Focus;
