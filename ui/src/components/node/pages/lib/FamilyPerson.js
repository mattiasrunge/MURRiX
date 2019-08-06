
import React from "react";
import PropTypes from "prop-types";
import { Icon, Item } from "semantic-ui-react";
import Component from "lib/component";
import { NodeImage, NodeLink } from "components/nodeparts";
import { cmd } from "lib/backend";
import theme from "../../theme.module.css";

class FamilyPerson extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            partner: false,
            age: {}
        };
    }

    async load() {
        await this.update(this.props);
    }

    componentDidUpdate(prevProps) {
        if (this.props.person.node.path !== prevProps.person.node.path) {
            this.update(this.props);
        }
    }

    async update(props) {
        this.setState({ age: {}, loading: true });

        try {
            const age = await cmd.age(props.person.node.path);
            const partner = await cmd.getpartner(props.person.node.path);

            !this.disposed && this.setState({ age, partner, loading: false });
        } catch (error) {
            // this.logError("Failed to get node url", error, 10000);
            !this.disposed && this.setState({ age: {}, partner: false, loading: false });
        }
    }

    render() {
        return (
            <Item.Group>
                <Item
                    style={{
                        border: "1px solid #d4d4d5",
                        height: this.props.person.location.h,
                        padding: 10
                    }}
                >
                    <NodeImage
                        className="ui tiny image"
                        style={{
                            margin: -10
                        }}
                        path={`${this.props.person.node.path}/profilePicture`}
                        format={{
                            width: this.props.person.location.h - 2,
                            height: this.props.person.location.h - 2,
                            type: "image"
                        }}
                    />
                    <Item.Content>
                        <Item.Header className={theme.familyPersonName}>
                            <NodeLink node={this.props.person.node} />
                        </Item.Header>
                        <Item.Extra>
                            <If condition={this.state.age && this.state.age.birthdate}>
                                <Icon name="calendar alternate outline" />
                                {this.state.age.birthdate}
                                <If condition={this.state.age.deathdate}>
                                    &nbsp;&nbsp;
                                    <Icon name="long arrow alternate right" />
                                    {this.state.age.deathdate}
                                </If>
                            </If>
                        </Item.Extra>
                        <Item.Extra>
                            <If condition={this.state.partner}>
                                <Icon name="heart" color="red" />
                                <NodeLink node={this.state.partner} />
                            </If>
                        </Item.Extra>
                    </Item.Content>
                </Item>
            </Item.Group>
        );
    }
}

FamilyPerson.propTypes = {
    person: PropTypes.object.isRequired
};

export default FamilyPerson;
