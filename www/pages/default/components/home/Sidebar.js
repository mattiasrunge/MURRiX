
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Header } from "semantic-ui-react";
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
                        location={this.props.location}
                    />
                    <SidebarMenuItem
                        theme={this.props.theme}
                        text="Search"
                        path={`${this.props.match.path}/search`}
                        location={this.props.location}
                    />
                    <SidebarMenuItem
                        theme={this.props.theme}
                        text="Browse by name"
                        path={`${this.props.match.path}/name`}
                        location={this.props.location}
                    />
                    <SidebarMenuItem
                        theme={this.props.theme}
                        text="Browse by year"
                        path={`${this.props.match.path}/year`}
                        location={this.props.location}
                    />
                    <SidebarMenuItem
                        theme={this.props.theme}
                        text="Browse by label"
                        path={`${this.props.match.path}/label`}
                        location={this.props.location}
                    />
                </div>
                <div className={this.props.theme.menu}>
                    <Header>Numbers</Header>
                    <SidebarMenuItem
                        theme={this.props.theme}
                        text="Charts"
                        path={`${this.props.match.path}/chart`}
                        location={this.props.location}
                    />
                </div>
            </div>
        );
    }
}

Sidebar.propTypes = {
    theme: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

export default Sidebar;
