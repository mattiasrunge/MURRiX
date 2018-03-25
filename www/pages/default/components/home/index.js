
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Home: require("./Home")
};

module.exports = themeify(theme, exports);
