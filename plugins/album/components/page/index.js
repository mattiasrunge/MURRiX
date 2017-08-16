
import ko from "knockout";
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import stat from "lib/status";
import NodeWidgetPage from "plugins/node/components/widget-page";

class AlbumPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            count: 0
        };
    }

    componentDidMount() {
        this.addDisposables([
            this.props.nodepath.subscribe((np) => this.load(np))
        ]);

        this.load(ko.unwrap(this.props.nodepath));
    }

    async load(nodepath) {
        if (!nodepath) {
            return this.setState({ count: 0 });
        }

        try {
            const node = await api.vfs.resolve(`${nodepath.path}/files`);

            if (!node) {
                return this.setState({ count: 0 });
            }

            this.setState({ count: node.properties.children.length });
        } catch (error) {
            stat.printError(error);
            this.setState({ count: 0 });
        }
    }

    render() {
        return (
            <NodeWidgetPage
                nodepath={this.props.nodepath}
                sections={[
                    {
                        name: "media",
                        icon: "photo_library",
                        title: "Media",
                        react: "node-section-media"
                    }
                ]}
                information={[
                    {
                        name: "Number of files",
                        value: this.state.count
                    }
                ]}
            />
        );
    }
}

AlbumPage.propTypes = {
    nodepath: PropTypes.func
};

export default AlbumPage;
