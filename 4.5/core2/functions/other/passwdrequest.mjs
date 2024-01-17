import { promisify } from "node:util";
//import { SMTPConnection } from "emailjs";
import Node from "../../../lib/Node.mjs";
import { getAdminClient } from "../../../auth/index.mjs";
import config from "../../../config/index.mjs";

export default async (client, username, templateUrl) => {
    /*const user = await Node.resolve(await getAdminClient(), `/users/${username}`);
    const resetId = await user.generatePasswordReset(await getAdminClient());
    const url = templateUrl.replace("$ID", resetId);
    const server = SMTPConnection.connect(config.email);
    const send = promisify(server.send).bind(server);

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
    });*/
};
