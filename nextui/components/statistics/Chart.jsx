
import React from "react";
import PropTypes from "prop-types";
import ChartJS, { defaults } from "react-chartjs-2";
import { Card } from "semantic-ui-react";
import theme from "./theme.module.css";

const Chart = ({ type, data, options, width, height }) => (
    <Card>
        <Card.Content>
            <Card.Header>{data.label}</Card.Header>
            <Card.Description className={theme.chartDescription}>
                <ChartJS
                    data={data}
                    type={type}
                    options={options}
                    height={height}
                    width={width}
                />
            </Card.Description>
        </Card.Content>
    </Card>
);

Chart.defaultProps = {
    options: defaults.global,
    type: "bar"
};

Chart.propTypes = {
    type: PropTypes.oneOf([ "bar", "line" ]),
    height: PropTypes.number,
    width: PropTypes.number,
    data: PropTypes.object,
    options: PropTypes.object
};

export default Chart;
