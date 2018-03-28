
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Route, Switch, Redirect } from "react-router-dom";
import { Container, Grid, Sticky } from "semantic-ui-react";
import { Profile } from "components/user";
import Sidebar from "./Sidebar";

class Home extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ref: null
        };
    }
    render() {
        const { contextRef } = this.state;
        const handleContextRef = (contextRef) => this.setState({ contextRef });

        return (
            <div ref={handleContextRef}>
                <Container>
                    <Grid columns={2}>
                        <Grid.Column width={3}>
                            <Sticky context={contextRef} >
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
                                            <div>News</div>
                                        )}
                                    />
                                    <Route
                                        path={`${this.props.match.path}/search`}
                                        render={(props) => (
                                            <div>Search</div>
                                        )}
                                    />
                                    <Route
                                        path={`${this.props.match.path}/name`}
                                        render={(props) => (
                                            <div>Names</div>
                                        )}
                                    />
                                    <Route
                                        path={`${this.props.match.path}/year`}
                                        render={(props) => (
                                            <div>Years</div>
                                        )}
                                    />
                                    <Route
                                        path={`${this.props.match.path}/label`}
                                        render={(props) => (
                                            <div>Labels</div>
                                        )}
                                    />
                                    <Route
                                        path={`${this.props.match.path}/chart`}
                                        render={(props) => (
                                            <div>Charts</div>
                                        )}
                                    />
                                    <Route
                                        path="*"
                                        render={() => (
                                            <Redirect
                                                to={{ pathname: `${this.props.match.path}/news` }}
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

export default Home;
