
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    News: require("./News")
};

module.exports = themeify(theme, exports);
