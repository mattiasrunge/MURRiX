
export default {
    ls: require("./commands/ls").default,
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
    admin: require("./commands/admin").default,
    mkuser: require("./commands/mkuser").default,
    mkgroup: require("./commands/mkgroup").default,
    usermod: require("./commands/usermod").default,
    useractivation: require("./commands/useractivation").default,
    users: require("./commands/users").default,
    groups: require("./commands/groups").default,
    label: require("./commands/label").default,
    login: require("./commands/login").default,
    logout: require("./commands/logout").default,
    regenerate: require("./commands/regenerate").default,
    ensurefilefaces: require("./commands/ensurefilefaces").default,
    migrateoldtags: require("./commands/migrateoldtags").default,

    setpartner: require("./commands/setpartner").default,
    setparent: require("./commands/setparent").default,
    dayinhistory: require("./commands/dayinhistory").default,
    latest: require("./commands/latest").default


    // Scripts
    // "script_hiderawfiles": require("./scripts/hiderawfiles").default,
    // "script_hidesomefiles": require("./scripts/hidesomefiles").default,
    // "script_hidevideoxmlfiles": require("./scripts/hidevideoxmlfiles").default,
    // "script_regeneratefiles": require("./scripts/regeneratefiles").default,
    // "script_findemptyalbums": require("./scripts/findemptyalbums").default,
    // "script_outputtest": require("./scripts/outputtest")
};