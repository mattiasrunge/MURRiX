
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Route, Switch, Redirect, withRouter } from "react-router-dom";
import { Container, Grid, Sticky } from "semantic-ui-react";
import { Profile } from "components/user";
import { Search, Name, Label, Year } from "components/search";
import { News } from "components/news";
import { Charts } from "components/statistics";
import Sidebar from "./Sidebar";

class Home extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ref: null
        };
    }

    onRef(ref) {
        this.setState({ ref });
    }

    render() {
        return (
            <div ref={(ref) => this.onRef(ref)}>
                <Container>
                    <Grid columns={2}>
                        <Grid.Column width={3}>
                            <Sticky context={this.state.ref} style={{
                                position: "relative",
                                zIndex: 1
                            }}>
                                <Sidebar {...this.props} />
                            </Sticky>
                        </Grid.Column>
                        <Grid.Column width={13}>
                            <div className={this.props.theme.homeContainer}>
                                <Switch>
                                    <Route
                                        path={`${this.props.match.path}/profile`}
                                        render={(props) => (
                                            <Profile {...props} />
                                        )}
                                    />
                                    <Route
                                        path={`${this.props.match.path}/news`}
                                        render={(props) => (
                                            <News {...props} />
                                        )}
                                    />
                                    <Route
                                        path={`${this.props.match.path}/search/:query?`}
                                        render={(props) => (
                                            <Search {...props} />
                                        )}
                                    />
                                    <Route
                                        path={`${this.props.match.path}/name/:letter?`}
                                        render={(props) => (
                                            <Name {...props} />
                                        )}
                                    />
                                    <Route
                                        path={`${this.props.match.path}/year/:year?`}
                                        render={(props) => (
                                            <Year {...props} />
                                        )}
                                    />
                                    <Route
                                        path={`${this.props.match.path}/label/:label?`}
                                        render={(props) => (
                                            <Label {...props} />
                                        )}
                                    />
                                    <Route
                                        path={`${this.props.match.path}/chart`}
                                        render={(props) => (
                                            <Charts {...props} />
                                        )}
                                    />
                                    <Route
                                        path="*"
                                        render={() => (
                                            <Redirect
                                                to={{
                                                    pathname: `${this.props.match.path}/news`
                                                }}
                                            />
                                        )}
                                    />
                                </Switch>
                            </div>
                        </Grid.Column>
                    </Grid>
                </Container>
            </div>
        );
    }
}

Home.propTypes = {
    theme: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired
};

export default withRouter(Home);
