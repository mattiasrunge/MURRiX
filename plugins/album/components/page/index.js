
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import AsyncComponent from "lib/async_component";
import stat from "lib/status";
import NodeWidgetPage from "plugins/node/components/widget-page";
import NodeSectionMedia from "plugins/node/components/section-media";

class AlbumPage extends AsyncComponent {
    getInitialState() {
        return { count: 0 };
    }

    onLoadError(error) {
        stat.printError(error);

        return { count: 0 };
    }

    async load(props, w) {
        if (!props.nodepath) {
            return { count: 0 };
        }

        const node = await w(api.vfs.resolve(`${props.nodepath.path}/files`, { noerror: true }));

        if (!node) {
            return { count: 0 };
        }

        return { count: node.properties.children.length };
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
                        Element: NodeSectionMedia
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
    nodepath: PropTypes.object.isRequired
};

export default AlbumPage;
