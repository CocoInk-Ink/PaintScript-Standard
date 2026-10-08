const path = require("node:path");

module.exports = {
    mode: "production",
    target: "web",
    entry: "./jint.js",
    output: {
        path: path.join(__dirname, "dist"),
        filename: "output.js",
        library: {
            name: "compilePaintScript",
            type: "var",
            export: "default"
        }
    }
};
