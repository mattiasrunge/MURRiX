
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Search: require("./Search"),
    Name: require("./Name"),
    Label: require("./Label"),
    Year: require("./Year")
};

module.exports = themeify(theme, exports);
