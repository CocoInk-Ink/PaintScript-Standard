// compiler.js

import fs from "fs";
import path from "path";
import { tokenize } from "./tokenizer.js";
import { ast_to_json } from "./ir.js";
import { link_session } from "./linker.js";

// Here we assume you have a parser that builds a Program AST from tokens.
// You can plug in the JS parser we started earlier.
import { Parser, parseProgram } from "./parser.js";

function strip_comments(lines) {
    const out = [];
    let in_block = false;

    for (const rawLine of lines) {
        let line = rawLine;

        if (in_block) {
            const end = line.indexOf("*/");
            if (end !== -1) {
                line = line.slice(end + 2);
                in_block = false;
            } else {
                continue;
            }
        }

        const block_start = line.indexOf("/*");
        if (block_start !== -1) {
            const block_end = line.indexOf("*/", block_start + 2);
            if (block_end !== -1) {
                line = line.slice(0, block_start) + line.slice(block_end + 2);
            } else {
                line = line.slice(0, block_start);
                in_block = true;
            }
        }

        const comment_index = line.indexOf("//");
        if (comment_index !== -1) {
            line = line.slice(0, comment_index);
        }

        if (line.trim() !== "") {
            out.push(line);
        }
    }

    return out;
}

function parse_metadata(lines) {
    if (lines.length < 2) {
        throw new Error("File missing metadata header.");
    }

    const header = lines[0].trim();
    const spriteLine = lines[1].trim();

    if (!header.startsWith("#PaintScript")) {
        throw new Error("Missing #PaintScript metadata.");
    }
    if (!spriteLine.startsWith("#Sprite")) {
        throw new Error("Missing #Sprite metadata.");
    }

    const version = header.slice("#PaintScript".length).trim();
    const sprite_name = spriteLine.slice("#Sprite".length).trim();

    if (!version) {
        throw new Error("Missing PaintScript version metadata.");
    }
    if (!sprite_name) {
        throw new Error("Missing sprite name metadata.");
    }

    return [version, sprite_name];
}

export function compile_file(sprite_name, instance_name, file_path, sessionid) {
    const lines = fs.readFileSync(file_path, "utf8").split(/\r?\n/);

    const [version, file_sprite] = parse_metadata(lines);
    if (instance_name !== file_sprite) {
        throw new Error(
            `Instance name '${instance_name}' does not match sprite metadata '${file_sprite}'.`
        );
    }

    const code = strip_comments(lines.slice(2)).join("\n");
    const tokens = tokenize(code);
    const programAst = new Parser(tokens, version, sprite_name, instance_name).parse_program();

    // Optional: type checking
    // check_program(programAst);

    const ir = ast_to_json(programAst);

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

if ((typeof process !== 'undefined') && (process.release.name === 'node')) Main();