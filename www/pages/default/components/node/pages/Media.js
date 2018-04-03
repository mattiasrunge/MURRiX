
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Grid, Header } from "semantic-ui-react";
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
