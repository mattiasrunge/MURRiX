
import React from "react";
import PropTypes from "prop-types";
import { withRouter } from "react-router-dom";
import Component from "lib/component";
import { Menu } from "semantic-ui-react";

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
    theme: PropTypes.object,
    history: PropTypes.object.isRequired
};

export default withRouter(HomeButton);
