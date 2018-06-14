
/* global document */

import React from "react";
import PropTypes from "prop-types";
import { Portal } from "semantic-ui-react";

class Fullscreen extends React.PureComponent {
    componentDidMount() {
        document.body.className = this.props.theme.fullscreen;
    }

    componentWillUnmount() {
        document.body.className = "";
    }

    render() {
        return (
            <Portal
                defaultOpen
                closeOnDocumentClick={false}
                closeOnEscape={false}
            >
                <div className={this.props.theme.fullscreen}>
                    {this.props.children}
                </div>
            </Portal>
        );
    }
}

Fullscreen.propTypes = {
    theme: PropTypes.object,
    children: PropTypes.node
};

export default Fullscreen;
