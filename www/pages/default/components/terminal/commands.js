
export default {
    ls: require("./commands/ls"),
    attribs: require("./commands/attribs"),
    props: require("./commands/props"),
    cp: require("./commands/cp"),
    mv: require("./commands/mv"),
    rm: require("./commands/rm"),
    ln: require("./commands/ln"),
    mkdir: require("./commands/mkdir"),
    chmod: require("./commands/chmod"),
    chown: require("./commands/chown"),
    getfacl: require("./commands/getfacl"),
    setfacl: require("./commands/setfacl"),
    setattr: require("./commands/setattr"),
    lookup: require("./commands/lookup"),
    find: require("./commands/find"),
    id: require("./commands/id"),
    whoami: require("./commands/whoami"),
    passwd: require("./commands/passwd"),
    admin: require("./commands/admin"),
    mkuser: require("./commands/mkuser"),
    mkgroup: require("./commands/mkgroup"),
    usermod: require("./commands/usermod"),
    useractivation: require("./commands/useractivation"),
    users: require("./commands/users"),
    groups: require("./commands/groups"),
    label: require("./commands/label"),
    login: require("./commands/login"),
    logout: require("./commands/logout"),
    regenerate: require("./commands/regenerate"),

    setpartner: require("./commands/setpartner"),
    setparent: require("./commands/setparent"),


    // Scripts
    // "script_hiderawfiles": require("./scripts/hiderawfiles"),
    // "script_hidesomefiles": require("./scripts/hidesomefiles"),
    // "script_hidevideoxmlfiles": require("./scripts/hidevideoxmlfiles"),
    // "script_regeneratefiles": require("./scripts/regeneratefiles"),
    // "script_findemptyalbums": require("./scripts/findemptyalbums"),
    // "script_outputtest": require("./scripts/outputtest")
};
