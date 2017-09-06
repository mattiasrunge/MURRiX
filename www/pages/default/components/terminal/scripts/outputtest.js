
export default {
    desc: "Test output",
    exec: async (term, streams) => {
        for (let n = 1; n < 10; n++) {
            await new Promise((resolve) => {
                setTimeout(() => {
                    streams.stdout.write(`${n}\n`);
                    resolve();
                }, 1000);
            });
        }

        return "Done";
    }
};
