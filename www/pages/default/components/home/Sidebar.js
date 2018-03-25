
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Menu } from "semantic-ui-react";

class Sidebar extends Component {
    render() {
        return (
            <div>
                <Menu tabular vertical borderless>
                    <Menu.Item header>Explore</Menu.Item>
                    <Menu.Item
                        icon="newspaper"
                        content="News"
                        active
                        link
                    />
                    <Menu.Item
                        icon="search"
                        content="Search"
                        link
                    />
                    <Menu.Item
                        icon="folder outline"
                        content="Browse by name"
                        link
                    />
                    <Menu.Item
                        icon="calendar"
                        content="Browse by year"
                        link
                    />
                    <Menu.Item
                        icon="tags"
                        content="Browse by label"
                        link
                    />
                    <Menu.Item header>Numbers</Menu.Item>
                    <Menu.Item
                        icon="bar chart"
                        content="Charts"
                        link
                    />
                </Menu>
            </div>
        );
    }
}

Sidebar.propTypes = {
    theme: PropTypes.object
};

export default Sidebar;
