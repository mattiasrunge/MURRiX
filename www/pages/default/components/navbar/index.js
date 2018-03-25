
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Navbar: require("./Navbar")
};

module.exports = themeify(theme, exports);
