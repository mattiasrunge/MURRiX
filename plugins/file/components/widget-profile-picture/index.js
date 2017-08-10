
import ko from "knockout";
import api from "api.io-client";
import stat from "lib/status";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";

class FileWidgetProfilePicture extends Component {
    constructor(props) {
        super(props);

        this.state = {
            url: false
        };
    }

    componentDidMount() {
        if (ko.isObservable(this.props.path)) {
            this.addDisposables([
                this.props.path.subscribe((path) => this.load(path))
            ]);
        }

        this.load(ko.unwrap(this.props.path));
    }

    componentWillReceiveProps(nextProps) {
        if (ko.unwrap(this.props.path) !== ko.unwrap(nextProps.path)) {
            this.load(ko.unwrap(nextProps.path));
        }
    }

    async load(abspath) {
        try {
            this.setState({ url: false });

            const node = await api.vfs.resolve(`${abspath}/profilePicture`, { noerror: true });
            let id = false;

            if (node) {
                id = node._id;
            } else {
                const nodepath = (await api.vfs.list(`${abspath}/files`, { noerror: true, limit: 1 }))[0];

                id = nodepath ? nodepath.node._id : false;
            }

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
            <div className="file-widget-profile-picture">
                <If condition={this.state.url}>
                    <img
                        src={this.state.url}
                        style={{ width: parseInt(ko.unwrap(this.props.size), 10), height: parseInt(ko.unwrap(this.props.size), 10) }}
                        className={ko.unwrap(this.props.classes)}
                    />
                </If>
            </div>
        );
    }
}

FileWidgetProfilePicture.propTypes = {
    path: PropTypes.any,
    size: PropTypes.any,
    classes: PropTypes.any
};

export default FileWidgetProfilePicture;
