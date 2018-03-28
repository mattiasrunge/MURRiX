
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Profile: require("./Profile")
};

module.exports = themeify(theme, exports);
