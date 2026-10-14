import fs from "fs";
import path from "path";
import { compile_source } from "./compiler-core.js";
import { link_session } from "./linker.js";

export { compile_source };

export function compile_file(sprite_name, instance_name, file_path, sessionid) {
    const source = fs.readFileSync(file_path, "utf8");
    const ir = compile_source(source, sprite_name, instance_name);

    const session_dir = path.resolve("sessions", sessionid);
    if (!fs.existsSync(session_dir)) {
        fs.mkdirSync(session_dir, { recursive: true });
    }

    const fileStem = `${instance_name}_${Date.now()}`;
    const out_path = path.join(session_dir, `${fileStem}.json`);
    fs.writeFileSync(out_path, JSON.stringify(ir, null, 4), "utf8");
    console.log(`Compiled → ${out_path}`);
}

export function compile_script(sprite_name, instance_name, script_path, sessionid) {
    compile_file(sprite_name, instance_name, script_path, sessionid);
    link_session(sessionid);
}

function Main() {
    const argv = process.argv.slice(2);

    if (argv.includes("--link")) {
        const sessionIndex = argv.indexOf("--session");
        const sessionKey = sessionIndex === -1 ? null : argv[sessionIndex + 1];

        if (!sessionKey) {
            console.error("Missing --session <id> for linking.");
            process.exitCode = 1;
            return;
        }

        link_session(sessionKey);
        return;
    }

    if (argv.length < 3) {
        console.error(
            "Usage: node compiler.js <SpriteName> <InstanceName> <ScriptFile> --session <id>"
        );
        process.exitCode = 1;
        return;
    }

    const Sprite = argv[0];
    const instance = argv[1];
    const scriptPath = argv[2];

    const sessionIndex = argv.indexOf("--session");
    const sessionKey = sessionIndex === -1 ? null : argv[sessionIndex + 1];

    if (!sessionKey) {
        console.error("Missing --session <id>");
        process.exitCode = 1;
        return;
    }

    compile_file(Sprite, instance, scriptPath, sessionKey);
}

if (typeof process !== "undefined" && process.release?.name === "node") {
    Main();
}
