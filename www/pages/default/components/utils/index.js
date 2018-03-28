
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Focus: require("./Focus")
};

module.exports = themeify(theme, exports);
