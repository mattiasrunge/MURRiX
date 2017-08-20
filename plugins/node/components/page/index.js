
import loc from "lib/location";
import api from "api.io-client";
import React from "react";
import Component from "lib/component";
import stat from "lib/status";
import ui from "lib/ui";
import PeoplePage from "plugins/people/components/page";
import AlbumPage from "plugins/album/components/page";
import LocationPage from "plugins/location/components/page";
import CameraPage from "plugins/camera/components/page";

class NodePage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            nodepath: false
        };
    }

    componentDidMount() {
        this.addDisposables([
            loc.subscribe(({ path }) => this.load(path))
        ]);

        this.load(loc.get("path"));
    }

    async load(path) {
        if (!path) {
            ui.setTitle(false);

            return this.setState({ nodepath: false });
        }

        try {
            const nodepath = await api.vfs.resolve(path, { noerror: true, nodepath: true });

            ui.setTitle(nodepath.node.attributes.name);
            this.setState({ nodepath });
        } catch (error) {
            stat.printError(error);
            ui.setTitle(false);

            return this.setState({ nodepath: false });
        }
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

export default NodePage;
