
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Edit: require("./Edit"),
    Create: require("./Create")
};

module.exports = themeify(theme, exports);
