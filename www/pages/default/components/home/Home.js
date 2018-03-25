
import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Container, Grid, Header, Image, Rail, Segment, Sticky } from "semantic-ui-react";
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
                                <div className={this.props.theme.homeSidebar}>
                                    <Sidebar theme={this.props.theme} />
                                </div>
                            </Sticky>
                        </Grid.Column>
                        <Grid.Column width={13}>
                            <div className={this.props.theme.homeContainer}>
                                Home
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                                hej<br />
                            </div>
                        </Grid.Column>
                    </Grid>
                </Container>
            </div>
        );
    }
}

Home.propTypes = {
    theme: PropTypes.object
};

export default Home;
