
import themeify from "lib/themeify";
import theme from "./theme.css";

const exports = {
    Upload: require("./Upload"),
    UploadProgress: require("./UploadProgress")
};

module.exports = themeify(theme, exports);
