
import React from "react";
import PropTypes from "prop-types";
import { Loader } from "semantic-ui-react";
import usePosition2Address from "hooks/usePosition2Address";

const Address = ({ longitude, latitude }) => {
    const [ address, , loading ] = usePosition2Address(longitude, latitude);

    return (
        <Choose>
            <When condition={loading}>
                <Loader active />
            </When>
            <Otherwise>
                <span>{address}</span>
            </Otherwise>
        </Choose>
    );
};

Address.propTypes = {
    longitude: PropTypes.number.isRequired,
    latitude: PropTypes.number.isRequired
};

export default Address;
