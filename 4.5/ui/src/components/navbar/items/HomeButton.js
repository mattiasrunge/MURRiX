
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import { Menu } from "semantic-ui-react";
import Component from "lib/component";

class HomeButton extends Component {
    onHome() {
        this.props.history.push("/");
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
    history: PropTypes.object.isRequired
};

export default withRouter(HomeButton);
