
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Menu } from "semantic-ui-react";

class HomeButton extends Component {
    onHome() {
        this.context.router.history.push("/");
    }

    render() {
        return (
            <Menu.Item
                icon="home"
                fitted="vertically"
                onClick={() => this.onHome()}
            />
        );
    }
}

HomeButton.propTypes = {
    theme: PropTypes.object
};

HomeButton.contextTypes = {
    router: PropTypes.object.isRequired
};

export default HomeButton;
