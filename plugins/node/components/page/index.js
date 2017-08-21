
import api from "api.io-client";
import React from "react";
import PropTypes from "prop-types";
import AsyncComponent from "lib/async_component";
import stat from "lib/status";
import ui from "lib/ui";
import PeoplePage from "plugins/people/components/page";
import AlbumPage from "plugins/album/components/page";
import LocationPage from "plugins/location/components/page";
import CameraPage from "plugins/camera/components/page";

class NodePage extends AsyncComponent {
    getInitialState() {
        return { nodepath: false };
    }

    onLoadError(error) {
        stat.printError(error);
        ui.setTitle(false);

        return { nodepath: false };
    }

    async load(props, w) {
        if (this.state.nodepath && this.state.nodepath.path === props.path) {
            return {};
        }

        if (!props.path) {
            ui.setTitle(false);

            return { nodepath: false };
        }

        const nodepath = await w(api.vfs.resolve(props.path, { noerror: true, nodepath: true }));

        ui.setTitle(nodepath.node.attributes.name);

        return { nodepath };
    }

    render() {
        return (
            <div>
                <If condition={this.state.nodepath}>
                    <Choose>
                        <When condition={this.state.nodepath.node.properties.type === "p"}>
                            <PeoplePage nodepath={this.state.nodepath} />
                        </When>
                        <When condition={this.state.nodepath.node.properties.type === "a"}>
                            <AlbumPage nodepath={this.state.nodepath} />
                        </When>
                        <When condition={this.state.nodepath.node.properties.type === "l"}>
                            <LocationPage nodepath={this.state.nodepath} />
                        </When>
                        <When condition={this.state.nodepath.node.properties.type === "c"}>
                            <CameraPage nodepath={this.state.nodepath} />
                        </When>
                    </Choose>
                </If>
            </div>
        );
    }
}

NodePage.propTypes = {
    path: PropTypes.string.isRequired
};

export default NodePage;
