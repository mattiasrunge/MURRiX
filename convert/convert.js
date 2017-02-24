"use strict";

const fs = require("fs");
const path = require("path");
const hogan = require("hogan.js");

const ucfirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const componentListPath = path.join(__dirname, "..", "www", "lib", "components.js");
const componentPath = process.argv[2];
const componentName = path.basename(componentPath);
const componentNamespace = path.basename(path.dirname(path.dirname(componentPath)));
const name = [ componentNamespace ].concat(componentName.split("-")).map(ucfirst).join("");

console.log("componentPath", componentPath);
console.log("componentName", componentName);
console.log("componentNamespace", componentNamespace);
console.log("name", name);

const componentList = fs.readFileSync(componentListPath).toString();
const component = fs.readFileSync(path.join(__dirname, "template.js")).toString();
const model = fs.readFileSync(path.join(componentPath, "model.js")).toString().replace(/\t/g, "    ").replace(/\r/g, "");
const html = fs.readFileSync(path.join(componentPath, "template.html")).toString().replace(/\t/g, "    ").replace(/\r/g, "");

const template = hogan.compile(component);

let foundModel = false;
const requires = [];
const modelLines = [];
const htmlLines = [];

for (const line of model.split("\n")) {
    if (line.includes("\"use strict\";")) {
        continue;
    }

    if (!foundModel && line.includes("require")) {
        requires.push(line);
    } else if (!foundModel && line.trim() === "") {
        continue;
    } else if (foundModel && line.trim() === "") {
        modelLines.push("");
    } else {
        const newLine = line
        .replace(/\.params/g, ".par_ams")
        .replace(/params/g, "this.props")
        .replace(/par_ams/g, "params")
        .replace(/const dispose = /g, "model.dispose = ");

        modelLines.push(`        ${newLine}`);
        foundModel = true;
    }
}

for (const line of html.split("\n")) {
    const newLine = line
    .replace(/\$component/g, "$root")
    .replace(/component/g, "react")
    .replace(/class=/g, "className=")
    .replace(/tabindex=/g, "tabIndex=")
    .replace(/autocomplete=/g, "autoComplete=")
    .replace(/autoplay/g, "autoPlay")
    .replace(/<\!--/g, "{/* ")
    .replace(/-->/g, " */}")
    .replace(/<br>/g, "<br />")
    .replace(/for=/g, "htmlFor=")
    .replace(/style="(.*?)"/g, (whole, content) => {
        // console.error("whole", whole);
        // console.error("content", content);

        const lines = content.split(";").map((s) => s.trim());
        const style = [];

        for (const line of lines) {
            if (line.trim() === "") {
                continue;
            }

            const [ name, value ] = line.split(":");

            const newName = name.trim().split("-").map((v, i) => i === 0 ? v : ucfirst(v)).join("");

            style.push(`${newName}: "${value.trim()}"`);
        }

        return whole.replace(`"${content}"`, `{{ ${style.join(", ")} }}`);
    });

    if (line.trim() === "") {
        htmlLines.push("");
    } else {
        htmlLines.push(`            ${newLine}`);
    }
}
// console.error("HTML", htmlLines.filter((line) => line.includes("style")));

// console.log("requires", requires);
// console.log("modelLines", modelLines);
// console.log("htmlLines", htmlLines);

const compiled = template.render({
    require: requires.join("\n"),
    name: name,
    model: modelLines.join("\n"),
    html: htmlLines.join("\n")
});

// console.log(compiled);
fs.writeFileSync(path.join(componentPath, "index.js"), compiled);

let includePath = `components/${path.basename(componentPath)}`;

if (componentPath.includes("plugins")) {
    includePath = `plugins/${componentNamespace}/components/${path.basename(componentPath)}`;
}

const componentListLines = [];

for (const line of componentList.split("\n")) {
    if (line.includes(includePath)) {
        continue;
    }

    componentListLines.push(line);

    if (line.includes("ADD HERE")) {
        componentListLines.push(`    "${componentNamespace}-${componentName}": require("${includePath}").default,`);
    }
}

// console.log(componentListLines);
fs.writeFileSync(componentListPath, componentListLines.join("\n"));
