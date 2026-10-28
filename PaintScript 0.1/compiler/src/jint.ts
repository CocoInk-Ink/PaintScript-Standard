import { compile_source } from "./compiler-core.js";

export default function compilePaintScript(sprite_name, instance_name, source_text, source_name) {
    let output;
    try {
        output = JSON.stringify(compile_source(source_text, sprite_name, instance_name));
    } catch (error) {
        output = "!Error! Failed to compile PaintScript source (" + source_name + "): " + error;
    }
    return output;
}
