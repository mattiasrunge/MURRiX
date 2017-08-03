
export default {
    attribs: require("./commands/attribs").default,
    props: require("./commands/props").default,
    cp: require("./commands/cp").default,
    mv: require("./commands/mv").default,
    rm: require("./commands/rm").default,
    ln: require("./commands/ln").default,
    mkdir: require("./commands/mkdir").default,
    chmod: require("./commands/chmod").default,
    chown: require("./commands/chown").default,
    getfacl: require("./commands/getfacl").default,
    setfacl: require("./commands/setfacl").default,
    setattr: require("./commands/setattr").default,
    lookup: require("./commands/lookup").default,
    find: require("./commands/find").default,
    id: require("./commands/id").default,
    whoami: require("./commands/whoami").default,
    passwd: require("./commands/passwd").default,
    mkuser: require("./commands/mkuser").default,
    mkgroup: require("./commands/mkgroup").default
};
