
import ko from "knockout";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import loc from "lib/location";
import stat from "lib/status";
import FileWidgetProfilePicture from "plugins/file/components/widget-profile-picture";

class FeedWidgetNewsPerson extends Component {
    constructor(props) {
        super(props);

        this.state = {
            target: false,
            nodepath: ko.unwrap(props.nodepath)
        };
    }

    componentDidMount() {
        if (ko.isObservable(this.props.nodepath)) {
            this.addDisposables([
                this.props.nodepath.subscribe((nodepath) => this.load(nodepath))
            ]);
        }

        this.load(ko.unwrap(this.props.nodepath));
    }

    async load(nodepath) {
        this.setState({ nodepath });

        if (!nodepath) {
            return this.setState({ target: false });
        }

        try {
            const node = await api.vfs.resolve(ko.unwrap(this.state.nodepath.node).attributes.path, { noerror: true });

            return this.setState({ target: node || false });
        } catch (error) {
            stat.printError(error);
            this.setState({ target: false });
        }
    }

    onClick(event) {
        event.preventDefault();

        loc.goto({ page: "node", path: ko.unwrap(this.state.nodepath.node).attributes.path });
    }

    render() {
        return (
            <div>
                <If condition={this.state.nodepath}>
                    <div className="news-media" onClick={(e) => this.onClick(e)}>
                        <FileWidgetProfilePicture
                            size={this.props.size}
                            classes="img-responsive img-fill"
                            responsive={true}
                            path={ko.unwrap(this.state.nodepath.node).attributes.path}
                        />
                    </div>
                </If>
                <If condition={this.state.target}>
                    <div className="news-name">
                        <a
                            href="#"
                            onClick={(e) => this.onClick(e)}
                        >
                            <h4>{this.state.target.attributes.name}</h4>
                        </a>
                    </div>
                    <If condition={this.state.target.attributes.description}>
                        <div className="news-description text-muted">
                            <p>{this.state.target.attributes.description}</p>
                        </div>
                    </If>
                </If>
            </div>
        );
    }
}

FeedWidgetNewsPerson.defaultProps = {
    size: 458
};

FeedWidgetNewsPerson.propTypes = {
    nodepath: PropTypes.any,
    size: PropTypes.number
};

export default FeedWidgetNewsPerson;
