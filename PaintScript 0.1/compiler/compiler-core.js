import { tokenize } from "./tokenizer.js";
import { ast_to_json } from "./ir.js";
import { Parser } from "./parser.js";

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

export function compile_source(source_text, sprite_name, instance_name) {
    if (typeof source_text !== "string") {
        throw new TypeError("PaintScript source must be a string.");
    }

    const lines = source_text.split(/\r?\n/);
    const [version, file_sprite] = parse_metadata(lines);
    if (instance_name !== file_sprite) {
        throw new Error(
            `Instance name '${instance_name}' does not match sprite metadata '${file_sprite}'.`
        );
    }

    const code = strip_comments(lines.slice(2)).join("\n");
    const tokens = tokenize(code);
    const programAst = new Parser(tokens, version, sprite_name, instance_name).parse_program();
    return ast_to_json(programAst);
}
