
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import format from "lib/format";
import { Grid, Header, Table } from "semantic-ui-react";
import { Comments } from "components/comment";

class Media extends Component {
    render() {
        return (
            <div className={this.props.theme.pageContainer}>
                <Grid columns="2">
                    <Grid.Column
                        className={this.props.theme.pageColumn}
                        width="12"
                    >
                        Media
                    </Grid.Column>
                    <Grid.Column
                        className={this.props.theme.pageColumn}
                        width="4"
                    >
                        <div className={this.props.theme.pageSidebar}>
                            <Header
                                className={this.props.theme.sidebarHeader}
                                size="small"
                            >
                                Description
                            </Header>
                            <Choose>
                                <When condition={this.props.node.attributes.description}>
                                    <p>{this.props.node.attributes.description}</p>
                                </When>
                                <Otherwise>
                                    <small>No description</small>
                                </Otherwise>
                            </Choose>

                            <Header
                                className={this.props.theme.sidebarHeader}
                                size="small"
                            >
                                Information
                            </Header>
                            <Table
                                className={this.props.theme.sidebarInformationTable}
                                basic="very"
                                size="small"
                                compact
                            >
                                <Table.Body>
                                    <Table.Row>
                                        <Table.Cell>
                                            <strong>Created</strong>
                                        </Table.Cell>
                                        <Table.Cell>
                                            {format.datetimeAgo(this.props.node.properties.birthtime)}
                                        </Table.Cell>
                                    </Table.Row>
                                    <Table.Row>
                                        <Table.Cell>
                                            <strong>Modified</strong>
                                        </Table.Cell>
                                        <Table.Cell>
                                            {format.datetimeAgo(this.props.node.properties.mtime)}
                                        </Table.Cell>
                                    </Table.Row>
                                </Table.Body>
                            </Table>

                            <Header
                                className={this.props.theme.sidebarHeader}
                                size="small"
                            >
                                Comments
                            </Header>
                            <Comments path={this.props.node.path} />
                        </div>
                    </Grid.Column>
                </Grid>
            </div>
        );
    }
}

Media.propTypes = {
    theme: PropTypes.object,
    node: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired
};

export default Media;
