
import React from "react";
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

export default Root;
