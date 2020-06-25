"use strict";

const fs = require("fs");
const path = require("path");
const { v4: uuid } = require("uuid");
const dropboxV2Api = require("dropbox-v2-api");
const config = require("../config");
const { assert } = require("console");
const log = require("../lib/log")(module);
const request = require("request");

const checkConfiguration = () => {
    assert(config.dropbox, "Configuration is missing dropbox configuration");
    assert(config.dropbox.key, "Configuration is missing dropbox key");
    assert(config.dropbox.secret, "Configuration is missing dropbox secret");
};

const createError = (data) => {
    if (typeof data === "string") {
        return new Error(data);
    } else if (data instanceof Error) {
        return data;
    }

    return new Error(data.error_summary);
};

const requestDropbox = async (token, resource, parameters) => {
    checkConfiguration();

    const dropbox = dropboxV2Api.authenticate({ token });

    return new Promise((resolve, reject) => {
        try {
            dropbox({
                resource,
                parameters
            }, (error, result) => {
                if (error) {
                    log.error(resource, parameters, error);

                    return reject(createError(error));
                }

                resolve(result);
            });
        } catch (error) {
            reject(createError(error));
        }
    });
};

const revoke = async (token) => requestDropbox(token, "auth/token/revoke");

const account = async (token) => requestDropbox(token, "users/get_current_account");

const space = async (token) => requestDropbox(token, "users/get_space_usage");

const list = async (token, folder) => {
    let result = await requestDropbox(token, "files/list_folder", {
        path: folder
    });
    let items = result.entries;

    while (result.has_more) {
        result = await requestDropbox(token, "files/list_folder/continue", {
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

    const opts = {
        method: "POST",
        uri: "https://content.dropboxapi.com/2/files/download",
        json: true,
        followRedirect: false,
        headers: {
            Authorization: `Bearer ${token}`,
            "Dropbox-API-Arg": `{"path":"${file.id}"}`
        }
    };

    // const dropbox = dropboxV2Api.authenticate({ token });

    return new Promise((resolve, reject) => {
        const targetfile = path.join(targetfolder, file.name);
        request(opts).pipe(fs.createWriteStream(targetfile)).on("close", (error) => {
            if (error) {
                return reject(createError(error));
            }

            resolve(targetfile);
        });

        // This code stores the file in the body as well as
        // pipe it to a file. With large files it failes on a
        // toString convertion, with a string is to long error
        // const stream = dropbox({
        //     resource: "files/download",
        //     parameters: {
        //         path: file.id
        //     }
        // }, (error) => {
        //     if (error) {
        //         return reject(createError(error));
        //     }

        //     resolve(targetfile);
        // });

        // stream.pipe(fs.createWriteStream(targetfile));
    });
};

const remove = async (token, file) => {
    await requestDropbox(token, "files/delete", {
        path: file.id
    });
};

const authRequests = {};

const authenticate = (baseUrl, resultFn) => {
    checkConfiguration();

    const id = uuid();
    const dropbox = dropboxV2Api.authenticate({
        client_id: config.dropbox.key, // eslint-disable-line camelcase
        client_secret: config.dropbox.secret, // eslint-disable-line camelcase
        redirect_uri: `${baseUrl}/dropbox`, // eslint-disable-line camelcase
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
};

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
