
import React from "react";
import { Menu, Container } from "semantic-ui-react";
import Component from "lib/component";
import UserMenu from "./items/UserMenu";
import RandomButton from "./items/RandomButton";
import StarMenu from "./items/StarMenu";
import HomeButton from "./items/HomeButton";
import AddMenu from "./items/AddMenu";
import SearchInput from "./items/SearchInput";
import theme from "./theme.module.css";

class Navbar extends Component {
    render() {
        return (
            <Menu
                fixed="top"
                color="blue"
                inverted
                borderless
                className={theme.navbar}
            >
                <Container>
                    <HomeButton {...this.props} />
                    <SearchInput {...this.props} />
                    <Menu.Menu position="right">
                        <StarMenu {...this.props} />
                        <RandomButton {...this.props} />
                        <AddMenu {...this.props} />
                        <UserMenu {...this.props} />
                    </Menu.Menu>
                </Container>
            </Menu>
        );
    }
}

export default Navbar;
