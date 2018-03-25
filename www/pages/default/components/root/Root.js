
import React from "react";
import PropTypes from "prop-types";
import { BrowserRouter, Route } from "react-router-dom";
import Component from "lib/component";
import Content from "./Content";

class Root extends Component {
    render() {
        return (
            <BrowserRouter>
                <Route
                    path="*"
                    render={(props) => (
                        <Content
                            {...this.props}
                            {...props}
                        />
                    )}
                />
            </BrowserRouter>
        );
    }
}

Root.propTypes = {
    theme: PropTypes.object
};

export default Root;
