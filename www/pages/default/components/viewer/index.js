
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Viewer: require("./Viewer")
};

module.exports = themeify(theme, exports);
