
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { Header } from "semantic-ui-react";
import Component from "lib/component";
import SidebarMenuItem from "./SidebarMenuItem";

class Sidebar extends Component {
    render() {
        return (
            <div className={this.props.theme.homeSidebar}>
                <div className={this.props.theme.menu}>
                    <Header>Explore</Header>
                    <SidebarMenuItem
                        theme={this.props.theme}
                        text="News"
                        path={`${this.props.match.path}/news`}
                    />
                    <SidebarMenuItem
                        theme={this.props.theme}
                        text="Search"
                        path={`${this.props.match.path}/search`}
                    />
                    <SidebarMenuItem
                        theme={this.props.theme}
                        text="Browse by name"
                        path={`${this.props.match.path}/name`}
                    />
                    <SidebarMenuItem
                        theme={this.props.theme}
                        text="Browse by label"
                        path={`${this.props.match.path}/label`}
                    />
                    <SidebarMenuItem
                        theme={this.props.theme}
                        text="Browse albums by year"
                        path={`${this.props.match.path}/year`}
                    />
                </div>
                <div className={this.props.theme.menu}>
                    <Header>Numbers</Header>
                    <SidebarMenuItem
                        theme={this.props.theme}
                        text="Charts"
                        path={`${this.props.match.path}/chart`}
                    />
                </div>
            </div>
        );
    }
}

Sidebar.propTypes = {
    theme: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default withRouter(Sidebar);
