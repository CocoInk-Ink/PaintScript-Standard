# linker.py

import os
import json


def merge_sprite_targets(targets):
    merged = {}

    for t in targets:
        name = t["name"]

        if name not in merged:
            merged[name] = {
                "name": t["name"],
                "instance": t["instance"],
                "variables": {},
                "functions": {},
                "events": {}
            }

        # merge variables
        merged[name]["variables"].update(t.get("variables", {}))

        # merge functions
        merged[name]["functions"].update(t.get("functions", {}))

        # merge events
        for evt_name, evt_list in t.get("events", {}).items():
            if evt_name not in merged[name]["events"]:
                merged[name]["events"][evt_name] = []
            merged[name]["events"][evt_name].extend(evt_list)

    return list(merged.values())


def link_session(sessionid):
    session_dir = os.path.join("sessions", sessionid)
    if not os.path.isdir(session_dir):
        print(f"No session directory found for '{sessionid}'.")
        return

    files = [
        os.path.join(session_dir, f)
        for f in os.listdir(session_dir)
        if f.endswith(".json") and f != "linked.json"
    ]

    if not files:
        print(f"No compiled sprite files found in session '{sessionid}'.")
        return

    linked_version = None
    linked_globals_vars = {}
    linked_globals_funcs = {}
    sprite_targets = []

    for path in files:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if linked_version is None:
            linked_version = data.get("version", "0.1.0")

        # merge globals
        globals_ = data.get("globals", {})
        linked_globals_vars.update(globals_.get("variables", {}))
        linked_globals_funcs.update(globals_.get("functions", {}))

        # extract the single sprite target
        sprite_targets.append({
            "name": data["name"],
            "instance": data["instance"],
            "variables": data.get("variables", {}),
            "functions": data.get("functions", {}),
            "events": data.get("events", {})
        })

    # merge sprite targets with same name
    merged_targets = merge_sprite_targets(sprite_targets)

    linked_program = {
        "version": linked_version,
        "permissions": {
            "filesystem": False,
            "networking": False
        },
        "globals": {
            "variables": linked_globals_vars,
            "functions": linked_globals_funcs
        },
        "targets": merged_targets
    }

    out_path = os.path.join(session_dir, "linked.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(linked_program, f, indent=4)

    print(f"Linked program → {out_path}")
