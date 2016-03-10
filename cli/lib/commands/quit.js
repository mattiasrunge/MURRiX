
const client = require("../client");

module.exports = {
    description: "Quit program",
    help: "Usage: quit",
    execute: function*(session, params) {
        session.quit();
        yield client.stop();
    }
};
