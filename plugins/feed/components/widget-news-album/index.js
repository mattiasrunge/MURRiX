
import ko from "knockout";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import loc from "lib/location";
import stat from "lib/status";

class FeedWidgetNewsAlbum extends Component {
    constructor(props) {
        super(props);

        this.state = {
            urls: [],
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
            return this.setState({ urls: [], target: false });
        }

        try {
            const target = await api.vfs.resolve(ko.unwrap(this.state.nodepath.node).attributes.path, { noerror: true });

            if (!target) {
                return this.setState({ urls: [] });
            }

            const imageOpts = {
                width: this.props.size,
                height: this.props.size,
                type: "image"
            };

            const files = await api.file.list(`${ko.unwrap(this.state.nodepath.node).attributes.path}/files`, { image: imageOpts, shuffle: true, limit: 5 });
            let urls = files.map((file) => file.filename).filter((url) => url);

            if (urls.length < 5 && urls.length > 2) {
                urls = urls.slice(0, 2);
            }

            return this.setState({ urls, target });
        } catch (error) {
            stat.printError(error);
            this.setState({ urls: [], target: false });
        }
    }

    onClick(event) {
        event.preventDefault();

        loc.goto({ page: "node", path: ko.unwrap(this.state.nodepath.node).attributes.path });
    }

    render() {
        return (
            <div>
                <Choose>
                    <When condition={this.state.urls.length === 5 || this.state.urls.length === 2}>
                        <div className="news-media" onClick={(e) => this.onClick(e)} style={{ cursor: "pointer" }}>
                            <div className="news-grid">
                                <For each="url" index="idx" of={this.state.urls}>
                                    <div className={`news-grid-${idx}`} key={url}>
                                        <img
                                            className="img-responsive img-fill"
                                            src={url}
                                        />
                                    </div>
                                </For>
                            </div>
                        </div>
                    </When>
                    <When condition={this.state.urls.length === 1}>
                        <div className="news-media" onClick={(e) => this.onClick(e)} style={{ cursor: "pointer" }}>
                            <img
                                className="img-responsive img-fill"
                                src={this.state.urls[0]}
                            />
                        </div>
                    </When>
                </Choose>
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
                            <p dangerouslySetInnerHTML={{ __html: this.state.target.attributes.description }}></p>
                        </div>
                    </If>
                </If>
            </div>
        );
    }
}

FeedWidgetNewsAlbum.defaultProps = {
    size: 600
};

FeedWidgetNewsAlbum.propTypes = {
    nodepath: PropTypes.any,
    size: PropTypes.number
};

export default FeedWidgetNewsAlbum;
