
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

class SidebarMenuItem extends Component {
    onClick() {
        this.context.router.history.push(this.props.path);
    }

    render() {
        const active = this.props.location.pathname.startsWith(this.props.path);

        return (
            <a
                className={`${this.props.theme.item} ${active ? this.props.theme.active : ""}`}
                onClick={() => this.onClick()}
            >
                {this.props.text}
            </a>
        );
    }
}

SidebarMenuItem.propTypes = {
    theme: PropTypes.object.isRequired,
    path: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired
};

SidebarMenuItem.contextTypes = {
    router: PropTypes.object.isRequired
};

export default SidebarMenuItem;
