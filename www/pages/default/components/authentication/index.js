
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    SignIn: require("./SignIn"),
    Reset: require("./Reset")
};

module.exports = themeify(theme, exports);
