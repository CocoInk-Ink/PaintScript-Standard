import { compile_source } from "./compiler-core.js";

export default function compilePaintScript(sprite_name, instance_name, source_text) {
    return compile_source(source_text, sprite_name, instance_name);
}
