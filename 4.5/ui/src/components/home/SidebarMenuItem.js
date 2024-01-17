
import React from "react";
import PropTypes from "prop-types";
import { Link, withRouter } from "react-router-dom";
import Component from "lib/component";
import theme from "./theme.module.css";

class SidebarMenuItem extends Component {
    render() {
        const active = this.props.location.pathname.startsWith(this.props.path);

        return (
            <Link
                className={`${theme.item} ${active ? theme.active : ""}`}
                to={this.props.path}
            >
                {this.props.text}
            </Link>
        );
    }
}

SidebarMenuItem.propTypes = {
    path: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired
};

export default withRouter(SidebarMenuItem);
