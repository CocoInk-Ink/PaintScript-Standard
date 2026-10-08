// linker.js

import fs from "fs";
import path from "path";

function merge_sprite_targets(targets) {
    const merged = {};

    for (const t of targets) {
        const name = t.name;

        if (!(name in merged)) {
            merged[name] = {
                name: t.name,
                instance: t.instance,
                variables: {},
                functions: {},
                events: {}
            };
        }

        merged[name].variables = {
            ...merged[name].variables,
            ...(t.variables || {})
        };

        merged[name].functions = {
            ...merged[name].functions,
            ...(t.functions || {})
        };

        for (const [evtName, evtList] of Object.entries(t.events || {})) {
            if (!(evtName in merged[name].events)) {
                merged[name].events[evtName] = [];
            }
            merged[name].events[evtName].push(...evtList);
        }
    }

    return Object.values(merged);
}

export function link_session(sessionid) {
    const session_dir = path.join("sessions", sessionid);
    if (!fs.existsSync(session_dir)) {
        console.log(`No session directory found for '${sessionid}'.`);
        return;
    }

    const files = fs.readdirSync(session_dir)
        .map(f => path.join(session_dir, f))
        .filter(f => f.endsWith(".json") && path.basename(f) !== "linked.json");

    if (!files.length) {
        console.log(`No compiled sprite files found in session '${sessionid}'.`);
        return;
    }

    let linked_version = null;
    const linked_globals_vars = {};
    const linked_globals_funcs = {};
    const sprite_targets = [];

    for (const p of files) {
        const data = JSON.parse(fs.readFileSync(p, "utf8"));

        if (linked_version === null) {
            linked_version = data.version ?? "0.1.0";
        }

        const globals = data.globals ?? {};
        linked_globals_vars["variables"] = {
            ...(linked_globals_vars["variables"] || {}),
            ...(globals["variables"] || {})
        };
        linked_globals_funcs["functions"] = {
            ...(linked_globals_funcs["functions"] || {}),
            ...(globals["functions"] || {})
        };

        sprite_targets.push({
            name: data.name,
            instance: data.instance,
            variables: data.vars ?? {},
            functions: data.functions ?? {},
            events: data.events ?? {}
        });
    }

    const merged_targets = merge_sprite_targets(sprite_targets);

    const linked_program = {
        version: linked_version,
        permissions: {
            filesystem: false,
            networking: false
        },
        globals: {
            variables: linked_globals_vars["variables"] || {},
            functions: linked_globals_funcs["functions"] || {}
        },
        targets: merged_targets
    };

    const out_path = path.join(session_dir, "linked.json");
    fs.writeFileSync(out_path, JSON.stringify(linked_program, null, 4), "utf8");
    console.log(`Linked program → ${out_path}`);
}
