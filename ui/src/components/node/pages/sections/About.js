
import React from "react";
import PropTypes from "prop-types";
import { Header, Grid, Table } from "semantic-ui-react";
import Component from "lib/component";
import { cmd } from "lib/backend";
import notification from "lib/notification";
import { NodeLink } from "components/nodeparts";

class About extends Component {
    constructor(props) {
        super(props);

        this.state = {
            partner: false,
            children: [],
            mother: false,
            father: false,
            loading: false,
            age: {}
        };
    }

    async load() {
        this.setState({ loading: true });

        try {
            const age = await cmd.age(this.props.node.path);
            const partner = await cmd.getpartner(this.props.node.path);
            const children = await cmd.getchildren(this.props.node.path);
            const mother = await cmd.getparent(this.props.node.path, "f");
            const father = await cmd.getparent(this.props.node.path, "m");

            this.setState({
                partner,
                children,
                mother,
                father,
                age,
                loading: false
            });
        } catch (error) {
            this.logError("Failed to load information", error);
            notification.add("error", error.message, 10000);
            this.setState({
                partner: false,
                children: [],
                mother: false,
                father: false,
                age: {},
                loading: false
            });
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps.node !== this.props.node) {
            this.load();
        }
    }

    render() {
        return (
            <div>
                <Header as="h2">
                    About
                    <Header.Subheader>
                        Details about person
                    </Header.Subheader>
                </Header>
                <Grid>
                    <Grid.Row>
                        <Grid.Column width={8}>
                            <Table definition>
                                <Table.Body>
                                    <Table.Row>
                                        <Table.Cell collapsing verticalAlign="top">
                                            Age
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Choose>
                                                <When condition={this.state.age.age}>
                                                    {this.state.age.age}
                                                </When>
                                                <Otherwise>
                                                    <i>Unknown</i>
                                                </Otherwise>
                                            </Choose>
                                        </Table.Cell>
                                    </Table.Row>
                                    <If condition={this.state.age.ageatdeath}>
                                        <Table.Row>
                                            <Table.Cell collapsing verticalAlign="top">
                                                Age at death
                                            </Table.Cell>
                                            <Table.Cell>
                                                {this.state.age.ageatdeath}
                                            </Table.Cell>
                                        </Table.Row>
                                    </If>
                                    <Table.Row>
                                        <Table.Cell collapsing verticalAlign="top">
                                            Birth name
                                        </Table.Cell>
                                        <Table.Cell>
                                            {this.props.node.attributes.birthname}
                                        </Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell collapsing verticalAlign="top">
                                            Full name
                                        </Table.Cell>
                                        <Table.Cell>
                                            {this.props.node.attributes.fullname}
                                        </Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell collapsing verticalAlign="top">
                                            Gender
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Choose>
                                                <When condition={this.props.node.attributes.gender === "m"}>
                                                    Male
                                                </When>
                                                <When condition={this.props.node.attributes.gender === "f"}>
                                                    Female
                                                </When>
                                                <Otherwise>
                                                    <i>Unknown</i>
                                                </Otherwise>
                                            </Choose>
                                        </Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell collapsing verticalAlign="top">
                                            Allergies
                                        </Table.Cell>
                                        <Table.Cell>
                                            {this.props.node.attributes.allergies}
                                        </Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>
                        </Grid.Column>
                        <Grid.Column width={8}>
                            <Header as="h4">Family</Header>
                            <Table definition>
                                <Table.Body>
                                    <Table.Row>
                                        <Table.Cell collapsing verticalAlign="top">
                                            Mother
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Choose>
                                                <When condition={this.state.mother}>
                                                    <NodeLink node={this.state.mother} />
                                                </When>
                                                <Otherwise>
                                                    <i>Unknown</i>
                                                </Otherwise>
                                            </Choose>
                                        </Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell collapsing verticalAlign="top">
                                            Father
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Choose>
                                                <When condition={this.state.father}>
                                                    <NodeLink node={this.state.father} />
                                                </When>
                                                <Otherwise>
                                                    <i>Unknown</i>
                                                </Otherwise>
                                            </Choose>
                                        </Table.Cell>
                                    </Table.Row>
                                    <If condition={this.state.partner}>
                                        <Table.Row>
                                            <Table.Cell collapsing verticalAlign="top">
                                                Partner
                                            </Table.Cell>
                                            <Table.Cell>
                                                <NodeLink node={this.state.partner} />
                                            </Table.Cell>
                                        </Table.Row>
                                    </If>
                                    <If condition={this.state.children.length > 0}>
                                        <Table.Row>
                                            <Table.Cell collapsing verticalAlign="top">
                                                Children
                                            </Table.Cell>
                                            <Table.Cell>
                                                <For each="child" of={this.state.children}>
                                                    <div key={child._id}>
                                                        <NodeLink node={child} />
                                                    </div>
                                                </For>
                                            </Table.Cell>
                                        </Table.Row>
                                    </If>
                                </Table.Body>
                            </Table>

                            <Header as="h4">Contact</Header>
                            <Table definition>
                                <Table.Body>
                                    <For each="entry" index="index" of={this.props.node.attributes.contact || []}>
                                        <Table.Row key={`${entry.type}-${index}`}>
                                            <Table.Cell collapsing verticalAlign="top">
                                                {entry.type}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {entry.data}
                                            </Table.Cell>
                                        </Table.Row>
                                    </For>
                                </Table.Body>
                            </Table>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </div>
        );
    }
}

About.propTypes = {
    node: PropTypes.object.isRequired
};

export default About;
