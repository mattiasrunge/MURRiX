
import React from "react";
import { Menu, Container } from "semantic-ui-react";
import useCurrentUser from "hooks/useCurrentUser";
import UserMenu from "./items/UserMenu";
import RandomButton from "./items/RandomButton";
import StarMenu from "./items/StarMenu";
import HomeButton from "./items/HomeButton";
import AddMenu from "./items/AddMenu";
import SearchInput from "./items/SearchInput";
import theme from "./theme.module.css";

const Navbar = () => {
    const user = useCurrentUser();

    return (
        <Menu
            fixed="top"
            color="blue"
            inverted
            borderless
            className={theme.navbar}
        >
            <Container>
                <HomeButton />
                <If condition={user && !user.isGuest}>
                    <SearchInput />
                    <Menu.Menu position="right">
                        <StarMenu />
                        <RandomButton />
                        <AddMenu />
                        <UserMenu user={user} />
                    </Menu.Menu>
                </If>
            </Container>
        </Menu>
    );
};

export default Navbar;
