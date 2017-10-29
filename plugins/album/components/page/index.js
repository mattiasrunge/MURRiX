
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import AsyncComponent from "lib/async_component";
import stat from "lib/status";
import NodeWidgetPage from "plugins/node/components/widget-page";
import NodeSectionMedia from "plugins/node/components/section-media";
import NodeSectionFiles from "plugins/node/components/section-files";

class AlbumPage extends AsyncComponent {
    getInitialState() {
        return { count: 0, extra: false };
    }

    onLoadError(error) {
        stat.printError(error);

        return { count: 0, extra: false };
    }

    async load(props, w) {
        if (!props.nodepath) {
            return { count: 0, extra: false };
        }

        const filesNode = await w(api.vfs.resolve(`${props.nodepath.path}/files`, { noerror: true }));
        const extraNode = await w(api.vfs.resolve(`${props.nodepath.path}/extra`, { noerror: true }));

        if (!filesNode) {
            return { count: 0 };
        }

        return {
            count: filesNode ? filesNode.properties.children.length : 0,
            extra: extraNode && extraNode.properties.children.length > 0
        };
    }

    render() {
        const sections = [
            {
                name: "media",
                icon: "photo_library",
                title: "Media",
                Element: NodeSectionMedia
            }
        ];

        if (this.state.extra) {
            sections.push({
                name: "extra",
                icon: "folder",
                title: "Extra",
                Element: NodeSectionFiles
            });
        }

        return (
            <NodeWidgetPage
                nodepath={this.props.nodepath}
                sections={sections}
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
