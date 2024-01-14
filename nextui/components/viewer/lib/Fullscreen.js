
/* global document */

import React from "react";
import PropTypes from "prop-types";
import { Portal } from "semantic-ui-react";
import theme from "../theme.module.css";

class Fullscreen extends React.PureComponent {
    componentDidMount() {
        document.body.className = theme.fullscreen;
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
                <div className={theme.fullscreen}>
                    {this.props.children}
                </div>
            </Portal>
        );
    }
}

Fullscreen.propTypes = {
    children: PropTypes.node
};

export default Fullscreen;
