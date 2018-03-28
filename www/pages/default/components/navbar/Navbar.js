
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Menu, Container } from "semantic-ui-react";
import UserMenu from "./items/UserMenu";
import RandomButton from "./items/RandomButton";
import StarMenu from "./items/StarMenu";
import HomeButton from "./items/HomeButton";
import AddMenu from "./items/AddMenu";
import SearchInput from "./items/SearchInput";

class Navbar extends Component {
    render() {
        return (
            <Menu
                fixed="top"
                color="blue"
                inverted
                borderless
                className={this.props.theme.navbar}
            >
                <Container>
                    <HomeButton {...this.props} />
                    <SearchInput {...this.props} />
                    <Menu.Menu position="right">
                        <AddMenu {...this.props} />
                        <StarMenu {...this.props} />
                        <RandomButton {...this.props} />
                        <UserMenu {...this.props} />
                    </Menu.Menu>
                </Container>
            </Menu>
        );
    }
}

Navbar.propTypes = {
    theme: PropTypes.object.isRequired
};

export default Navbar;
