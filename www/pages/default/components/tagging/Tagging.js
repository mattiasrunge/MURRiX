
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Header, Button } from "semantic-ui-react";
import { SelectableImageList } from "components/list";
import ui from "lib/ui";
import CircularList from "lib/circular_list";
import TagFile from "./TagFile";

class Tagging extends Component {
    constructor(props) {
        super(props);

        this.state = {
            selected: [],
            files: []
        };
    }

    async load() {
        this.addDisposables([
            ui.shortcut("right", this.onNext),
            ui.shortcut("left", this.onPrevious)
        ]);
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
                    className={this.props.theme.tagImageList}
                    path={`${this.props.node.path}/files`}
                    value={this.state.selected}
                    onChange={this.onFilesChange}
                    single
                />
                <If condition={this.state.files.length > 0}>
                    <div className={this.props.theme.navigationMenu}>
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
                        <div className={this.props.theme.imageCount}>
                            {this.state.files.indexOf(this.state.selected[0]) + 1}
                            {" of "}
                            {this.state.files.length}
                        </div>
                    </div>
                    <TagFile
                        theme={this.props.theme}
                        node={this.state.selected[0]}
                    />
                </If>
            </div>
        );
    }
}

Tagging.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired
};

Tagging.contextTypes = {
    router: PropTypes.object.isRequired
};

export default Tagging;
