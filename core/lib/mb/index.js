"use strict";

const amqp = require("amqplib");
const configuration = require("../config");

class MB {
    async init() {
        const url = configuration.rabbitUrl;

        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();
    }

    async sendToQueue(name, data) {
        await this.channel.sendToQueue(`murrix-${name}`, Buffer.from(JSON.stringify(data)));
    }

    async on(name, fn) {
        await this.channel.assertQueue(`murrix-${name}`);

        this.channel.consume(`murrix-${name}`, async (msg) => {
            try {
                const data = JSON.parse(Buffer.from(msg.content));

                await Promise.resolve(fn(data));

                this.channel.ack(msg);
            } catch (error) {
                console.error("Failed to handle message", msg, error);
            }
        });
    }

    isConnected() {
        return !!this.channel;
    }

    async stop() {
        await this.channel.close();
        await this.connection.close();

        this.channel = null;
        this.connection = null;
    }
}

module.exports = new MB();
