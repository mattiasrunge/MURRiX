
import ko from "knockout";
import api from "api.io-client";
import stat from "lib/status";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

class AuthWidgetPictureUser extends Component {
    constructor(props) {
        super(props);

        this.state = {
            url: false
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
            this.setState({ url: false });

            const id = await api.auth.picture(uid);

            if (id) {
                const url = await api.file.getMediaUrl(id, {
                    width: ko.unwrap(this.props.size),
                    height: ko.unwrap(this.props.size),
                    type: "image"
                });

                this.setState({ url });
            }
        } catch (error) {
            stat.printError(error);
            this.setState({ url: false });
        }
    }

    render() {
        return (
            <span>
                <If condition={this.state.url}>
                    <img
                        src={this.state.url}
                        style={{ width: parseInt(ko.unwrap(this.props.size), 10), height: parseInt(ko.unwrap(this.props.size), 10) }}
                        className={ko.unwrap(this.props.classes)}
                    />
                </If>
            </span>
        );
    }
}

AuthWidgetPictureUser.propTypes = {
    uid: PropTypes.any,
    size: PropTypes.any,
    classes: PropTypes.any
};

export default AuthWidgetPictureUser;
