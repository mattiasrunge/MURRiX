"use strict";

const util = require("util");
const email = require("emailjs");
const Node = require("../../../lib/Node");
const { getAdminClient } = require("../../../auth");
const config = require("../../../config");

module.exports = async (client, username, templateUrl) => {
    const user = await Node.resolve(await getAdminClient(), `/users/${username}`);
    const resetId = await user.generatePasswordReset(await getAdminClient());
    const url = templateUrl.replace("$ID", resetId);
    const server = email.server.connect(config.email);
    const send = util.promisify(server.send).bind(server);

    const text = `
A password reset for the account ${user.attributes.name} has been requested.
Please follow this link to set a new password:
  ${url}
`;
    const html = text.replace(url, `<a href="${url}">${url}</a>`).replace("\n", "<br>");

    await send({
        text,
        from: `no-reply <${config.email.user}>`,
        to: `${user.attributes.name} <${username}>`,
        subject: "Password reset",
        attachment: [
            {
                data: html,
                alternative: true
            }
        ]
    });
};
