
import ko from "knockout";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import loc from "lib/location";
import stat from "lib/status";

class FeedWidgetNewsFile extends Component {
    constructor(props) {
        super(props);

        this.state = {
            url: false,
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
            return this.setState({ url: false, target: false });
        }

        try {
            const target = await api.vfs.resolve(ko.unwrap(this.state.nodepath.node).attributes.path, { noerror: true });

            if (!target) {
                return this.setState({ url: false });
            }

            const url = await api.file.getMediaUrl(target._id, {
                width: this.props.size,
                type: "image"
            });

            return this.setState({ url, target });
        } catch (error) {
            stat.printError(error);
            this.setState({ url: false, target: false });
        }
    }

    onClick(event) {
        event.preventDefault();

        loc.goto({ showPath: ko.unwrap(this.state.nodepath.node).attributes.path });
    }

    render() {
        return (
            <div>
                <If condition={this.state.nodepath}>
                    <div className="news-media" onClick={(e) => this.onClick(e)} style={{ cursor: "pointer" }}>
                        <img
                            className="img-responsive img-fill"
                            src={this.state.url}
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

FeedWidgetNewsFile.defaultProps = {
    size: 458
};

FeedWidgetNewsFile.propTypes = {
    nodepath: PropTypes.any,
    size: PropTypes.number
};

export default FeedWidgetNewsFile;
