
import React from "react";
import PropTypes from "prop-types";

const themeHOC = (name, Component, theme) => {
    const WrappedComponent = class extends React.Component {
        render() {
            return (
                <Component
                    {...this.props}
                    theme={theme}
                />
            );
        }
    };

    WrappedComponent.displayName = `Themed${name}`;

    WrappedComponent.propTypes = {
        theme: PropTypes.object
    };

    return WrappedComponent;
};

const themify = (theme, Components) => {
    const exports = {};
    const names = Object.keys(Components);

    for (const name of names) {
        const Component = Components[name].default;

        exports[name] = themeHOC(name, Component, theme);
        exports[name].default = exports[name];
    }

    return exports;
};

export default themify;
