
import React from "react";
import PropTypes from "prop-types";
import { Header, Button } from "semantic-ui-react";
import Component from "lib/component";
import notification from "lib/notification";
import { api, event } from "lib/backend";
import { SelectableImageList } from "components/list";
import ui from "lib/ui";
import CircularList from "lib/circular_list";
import TagFile from "./TagFile";
import theme from "./theme.module.css";

class Tagging extends Component {
    constructor(props) {
        super(props);

        this.state = {
            suggestions: [],
            selected: [],
            files: []
        };
    }

    async load() {
        this.addDisposables([
            ui.shortcut("right", this.onNext),
            ui.shortcut("left", this.onPrevious)
        ]);

        this.addDisposables([
            event.on("node.appendChild", this.onNodeUpdated, { id: "Tagging" }),
            event.on("node.removeChild", this.onNodeUpdated, { id: "Tagging" })
        ]);

        await this.update(this.props);
    }

    onNodeUpdated = (event, { path }) => {
        if (path.startsWith(this.props.node.path) && path.endsWith("/tags")) {
            this.update(this.props);
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.node !== this.props.node) {
            this.update(this.props);
        }
    }

    async update(props) {
        if (props.node.properties.type !== "a") {
            return;
        }

        try {
            const suggestions = await api.albumtags(props.node.path);

            this.setState({
                suggestions
            });
        } catch (error) {
            this.logError("Failed to get tag suggestions", error);
            notification.add("error", error.message, 10000);
            this.setState({
                suggestions: []
            });
        }
    }

    onFilesChange = (selected, files) => {
        this.setState({ selected, files });
    }

    gotoFile(offset) {
        const list = new CircularList(this.state.files);

        const file = list
        .select(this.state.selected[0])
        .offset(offset)
        .current;

        if (!file) {
            return;
        }

        this.setState({ selected: [ file ] });
    }

    onNext = () => {
        this.gotoFile(1);
    }

    onPrevious = () => {
        this.gotoFile(-1);
    }

    render() {
        return (
            <div>
                <Header as="h2">
                    Tagging
                    <Header.Subheader>
                        Tag persons on files
                    </Header.Subheader>
                </Header>
                <SelectableImageList
                    className={theme.tagImageList}
                    path={`${this.props.node.path}/files`}
                    value={this.state.selected}
                    onChange={this.onFilesChange}
                    single
                />
                <If condition={this.state.files.length > 0}>
                    <div className={theme.navigationMenu}>
                        <Button
                            basic
                            size="mini"
                            content="Previous"
                            icon="left arrow"
                            labelPosition="left"
                            floated="left"
                            onClick={this.onPrevious}
                        />
                        <Button
                            basic
                            size="mini"
                            content="Next"
                            icon="right arrow"
                            labelPosition="right"
                            floated="right"
                            onClick={this.onNext}
                        />
                        <div className={theme.imageCount}>
                            {this.state.selected[0].attributes.name}
                            {" - "}
                            {this.state.files.indexOf(this.state.selected[0]) + 1}
                            {" of "}
                            {this.state.files.length}
                        </div>
                    </div>
                    <TagFile
                        theme={theme}
                        node={this.state.selected[0]}
                        suggestions={this.state.suggestions}
                    />
                </If>
            </div>
        );
    }
}

Tagging.propTypes = {
    node: PropTypes.object.isRequired
};

export default Tagging;
