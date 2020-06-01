"use strict";

const obscureRegexp = new RegExp(/[\u0020-\u007E\u00A0-\u00FF]+?/g);

module.exports = (stream) => {
    let obscurePrompt = false;

    stream.obscure = (prompt) => {
        obscurePrompt = prompt;
    };

    stream.unobscure = () => {
        obscurePrompt = false;
    };

    const _write = stream._write.bind(stream);

    // This is extremly hackish and will probably break at any time
    // The purpose is to allow for obscuring passwords and such
    // And some parts are to allow control chars like backspace in this mode
    stream._write = (chunk, encoding, callback) => {
        if (obscurePrompt) {
            const str = chunk.toString();

            // First test if our chunk starts with a non-printable char
            if (obscureRegexp.test(str[0])) {
                let obscured;

                // If we have delete the whole line will be replaced
                // and we don't want our prompt to become * so we must
                // check here.
                if (str.startsWith(obscurePrompt)) {
                    obscured = obscurePrompt + str.slice(obscurePrompt.length).replace(obscureRegexp, "*");
                } else {
                    obscured = str.replace(obscureRegexp, "*");
                }

                return _write(obscured, "utf8", callback);
            }
        }

        return _write(chunk, encoding, callback);
    };

    return stream;
};
