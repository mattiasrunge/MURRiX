
// Credits to https://github.com/reactjs/react-chartjs/issues/84

import React from "react";
import PropTypes from "prop-types";
import { Chart as ChartJS } from "chart.js";
import Component from "lib/component";

class Chart extends Component {
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
        super.componentWillUnmount();
    }

    createChart(props) {
        this.setState({
            chart: new ChartJS(this.ref.getContext("2d"), {
                type: props.type,
                data: props.data,
                options: props.options
            })
        });
    }

    onRef = (ref) => {
        this.ref = ref;
    }

    render() {
        return (
            <canvas
                ref={this.onRef}
                height={this.props.height}
                width={this.props.width}
            />
        );
    }
}

Chart.defaultProps = {
    options: ChartJS.defaults.global
};


Chart.propTypes = {
    type: PropTypes.oneOf([ "bar", "line" ]).isRequired,
    height: PropTypes.number,
    width: PropTypes.number,
    data: PropTypes.object,
    options: PropTypes.object
};

export default Chart;
