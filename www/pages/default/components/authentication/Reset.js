
import React from "react";
import PropTypes from "prop-types";
import { Route, Switch } from "react-router-dom";
import Component from "lib/component";
import RequestReset from "./RequestReset";
import ResetPassword from "./ResetPassword";

class Reset extends Component {
    render() {
        return (
            <Switch>
                <Route
                    path={`${this.props.match.path}/:username/:id`}
                    render={(props) => (
                        <ResetPassword {...props} theme={this.props.theme} />
                    )}
                />
                <Route
                    path={`${this.props.match.path}/:username?`}
                    render={(props) => (
                        <RequestReset {...props} theme={this.props.theme} />
                    )}
                />
            </Switch>
        );
    }
}

Reset.propTypes = {
    theme: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Reset;
