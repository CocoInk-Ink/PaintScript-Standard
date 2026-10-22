const path = require("node:path");

module.exports = {
    mode: "production",
    target: "web",
    entry: "./engine.js",
    output: {
        path: path.join(__dirname, "dist"),
        filename: "output.js",
        library: {
            name: "Runtime",
            type: "var",
            export: "default"
        }
    }
};
