
import React from "react";
import PropTypes from "prop-types";
import { Link, withRouter } from "react-router-dom";
import Component from "lib/component";

class SidebarMenuItem extends Component {
    render() {
        const active = this.props.location.pathname.startsWith(this.props.path);

        return (
            <Link
                className={`${this.props.theme.item} ${active ? this.props.theme.active : ""}`}
                to={this.props.path}
            >
                {this.props.text}
            </Link>
        );
    }
}

SidebarMenuItem.propTypes = {
    theme: PropTypes.object.isRequired,
    path: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired
};

export default withRouter(SidebarMenuItem);
