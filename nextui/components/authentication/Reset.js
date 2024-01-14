
import React from "react";
import PropTypes from "prop-types";
import { Route, Switch, withRouter } from "react-router-dom";
import Component from "lib/component";
import RequestReset from "./RequestReset";
import ResetPassword from "./ResetPassword";
import theme from "./theme.module.css";

class Reset extends Component {
    render() {
        return (
            <Switch>
                <Route
                    path={`${this.props.match.path}/:username/:id`}
                    render={(props) => (
                        <ResetPassword {...props} theme={theme} />
                    )}
                />
                <Route
                    path={`${this.props.match.path}/:username?`}
                    render={(props) => (
                        <RequestReset {...props} theme={theme} />
                    )}
                />
            </Switch>
        );
    }
}

Reset.propTypes = {
    match: PropTypes.object.isRequired
};

export default withRouter(Reset);
