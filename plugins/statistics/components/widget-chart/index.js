
// Credits to https://github.com/reactjs/react-chartjs/issues/84

import React from "react";
import PropTypes from "prop-types";
import Component from "lib/component";
import { Chart as ChartJS } from "chart.js";

class StatisticsWidgetChart extends Component {
    constructor(props) {
        super(props);

        this.state = {
            chart: null
        };
    }

    componentDidMount() {
        this.createChart(this.props);
    }

    componentWillUnmount() {
        this.state.chart.destroy();
    }

    createChart(props) {
        this.setState({
            chart: new ChartJS(this.refs.canvas.getContext("2d"), {
                type: props.type,
                data: props.data,
                options: props.options
            })
        });
    }

    render() {
        return (
            <canvas
                ref="canvas"
                height={this.props.height}
                width={this.props.width}
            />
        );
    }
}

StatisticsWidgetChart.defaultProps = {
    options: ChartJS.defaults.global
};


StatisticsWidgetChart.propTypes = {
    type: PropTypes.oneOf([ "bar", "line" ]).isRequired,
    height: PropTypes.number,
    width: PropTypes.number,
    data: PropTypes.object,
    options: PropTypes.object
};

export default StatisticsWidgetChart;
