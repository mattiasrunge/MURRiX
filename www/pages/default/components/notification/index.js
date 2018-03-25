
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Notification: require("./Notification")
};

module.exports = themeify(theme, exports);
