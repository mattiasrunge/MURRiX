
import React from "react";
import PropTypes from "prop-types";
import { Container, Grid, Sticky } from "semantic-ui-react";
import Sidebar from "./Sidebar";
import theme from "./theme.module.css";

const STYLE = {
    position: "relative",
    zIndex: 1
};

const Home = ({ children }) => {
    const ref = React.useRef();

    return (
        <div ref={ref}>
            <Container>
                <Grid columns={2}>
                    <Grid.Column width={3}>
                        <Sticky
                            context={ref.current}
                            style={STYLE}
                            offset={54}
                        >
                            <Sidebar />
                        </Sticky>
                    </Grid.Column>
                    <Grid.Column width={13}>
                        <div className={theme.homeContainer}>
                            {children}
                        </div>
                    </Grid.Column>
                </Grid>
            </Container>
        </div>
    );
};

Home.propTypes = {
    children: PropTypes.any
};

export default Home;
