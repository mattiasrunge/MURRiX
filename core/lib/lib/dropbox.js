"use strict";

const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const dropboxV2Api = require("dropbox-v2-api");
const config = require("../config");
const { assert } = require("console");
const log = require("../lib/log")(module);

const checkConfiguration = () => {
    assert(config.dropbox, "Configuration is missing dropbox configuration");
    assert(config.dropbox.key, "Configuration is missing dropbox key");
    assert(config.dropbox.secret, "Configuration is missing dropbox secret");
}

const request = async (token, resource, parameters) => {
    checkConfiguration();

    const dropbox = dropboxV2Api.authenticate({ token });

    return new Promise((resolve, reject) => {
        try {
            dropbox({
                resource,
                parameters
            }, (error, result) => {
                if (error) {
                    return reject(new Error(error));
                }

                resolve(result);
            });
        } catch (error) {
            reject(new Error(error));
        }
    });
};

const revoke = async(token) => {
    return await request(token, "auth/token/revoke");
};

const account = async(token) => {
    return await request(token, "users/get_current_account");
};

const space = async(token) => {
    return await request(token, "users/get_space_usage");
};

const list = async (token, folder) => {
    let result = await request(token, "files/list_folder", {
        path: folder
    });
    let items = result.entries;

    while (result.has_more) {
        result = await request(token, "files/list_folder/continue", {
            cursor: result.cursor
        });

        items = [ ...items, ...result.entries ];
    }

    return items
    .filter((item) => item.is_downloadable && item[".tag"] === "file")
    .map((item) => ({
        name: item.name,
        path: item.path_display,
        id: item.id,
        size: item.size
    }));
};

const download = async (token, file, targetfolder) => {
    checkConfiguration();

    const dropbox = dropboxV2Api.authenticate({ token });

    return new Promise((resolve, reject) => {
        const targetfile = path.join(targetfolder, file.name);
        const stream = dropbox({
            resource: "files/download",
            parameters: {
                path: file.id
            }
        }, (error) => {
            if (error) {
                return reject(error);
            }

            resolve(targetfile);
        });

        stream.pipe(fs.createWriteStream(targetfile));
    });
};

const remove = async (token, file) => {
    await request(token, "files/delete", {
        path: file.id
    });
};

const authRequests = {};

const authenticate = (baseUrl, resultFn) => {
    checkConfiguration();

    const id = uuid();
    const dropbox = dropboxV2Api.authenticate({
        client_id: config.dropbox.key,
        client_secret: config.dropbox.secret,
        redirect_uri: `${baseUrl}/dropbox`,
        state: id
    });

    // Remove request after 10 minutes
    const timer = setTimeout(() => delete authRequests[id], 1000 * 60 * 10);

    authRequests[id] = (code) => {
        clearTimeout(timer);

        dropbox.getToken(code, (error, response) => {
            if (error) {
                return resultFn(error);
            }

            resultFn(null, response.access_token);
        });
    };

    return `${dropbox.generateAuthUrl()}&state=${id}`;
};

const handler = async (ctx) => {
    const id = ctx.query.state;

    try {
        assert(authRequests[id], `No authorization request with id ${id} found`);
    } catch (error) {
        log.error(error);

        ctx.status = 400;
        ctx.body = "Authorization failed";

        return;
    }

    const callbackFn = authRequests[id];
    delete authRequests[id];

    callbackFn(ctx.query.code);

    ctx.status = 200;
    ctx.body = "Authorization complete, you can close this window now";
}

module.exports = {
    list,
    download,
    remove,
    authenticate,
    revoke,
    handler,
    account,
    space
};
