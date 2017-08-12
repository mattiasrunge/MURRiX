
import ko from "knockout";
import api from "api.io-client";
import stat from "lib/status";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

class AuthWidgetNameUser extends Component {
    constructor(props) {
        super(props);

        this.state = {
            name: "Unknown"
        };
    }

    componentDidMount() {
        if (ko.isObservable(this.props.uid)) {
            this.addDisposables([
                this.props.uid.subscribe((uid) => this.load(uid))
            ]);
        }

        this.load(ko.unwrap(this.props.uid));
    }

    componentWillReceiveProps(nextProps) {
        if (ko.unwrap(this.props.uid) !== ko.unwrap(nextProps.uid)) {
            this.load(ko.unwrap(nextProps.uid));
        }
    }

    async load(uid) {
        try {
            this.setState({ name: "Unknown" });

            const name = await api.auth.name(uid);

            this.setState({ name });
        } catch (error) {
            stat.printError(error);
            this.setState({ name: "Unknown" });
        }
    }

    render() {
        return (
            <span>{this.state.name}</span>
        );
    }
}

AuthWidgetNameUser.propTypes = {
    uid: PropTypes.any
};

export default AuthWidgetNameUser;
