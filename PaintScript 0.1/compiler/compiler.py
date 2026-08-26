# compiler.py

import json
from tokenizer import tokenize

def strip_comments(lines):
    out = []
    in_block = False

    for line in lines:
        if "/*" in line:
            in_block = True
        if not in_block:
            if not line.strip().startswith("//") and line.strip() != "":
                out.append(line)
        if "*/" in line:
            in_block = False
    return out

def parse_metadata(lines):
    paint = lines[0].strip()
    sprite = lines[1].strip()

    if not paint.startswith("#PaintScript"):
        raise Exception("Missing #PaintScript")
    if not sprite.startswith("#Sprite"):
        raise Exception("Missing #Sprite")

    version = paint.split(" ", 1)[1]
    sprite_name = sprite.split(" ", 1)[1]

    return version, sprite_name

def parse_globals(tokens):
    globals_list = []
    i = 0
    while i < len(tokens):
        if tokens[i]["value"] == "global":
            # global var Exit:String = empty;
            name = tokens[i+2]["value"]
            type_ = tokens[i+4]["value"]
            globals_list.append({"name": name, "type": type_})
        i += 1
    return globals_list

def parse_public_vars(tokens):
    publics = []
    i = 0
    while i < len(tokens):
        if tokens[i]["value"] == "public":
            name = tokens[i+2]["value"]
            type_ = tokens[i+4]["value"]
            publics.append({"name": name, "type": type_})
        i += 1
    return publics

def parse_sprite_vars(tokens):
    vars_list = []
    i = 0
    while i < len(tokens):
        if tokens[i]["value"] == "var":
            name = tokens[i+1]["value"]
            vars_list.append({"name": name})
        i += 1
    return vars_list

def parse_events(tokens):
    events = []
    i = 0
    while i < len(tokens):
        if tokens[i]["type"] == "AT_EVENT":
            event_name = tokens[i]["value"][1:]  # remove '@'
            events.append({"event": event_name})
        i += 1
    return events

def parse_functions(tokens):
    funcs = []
    i = 0
    while i < len(tokens):
        if tokens[i]["value"] == "function" or tokens[i]["value"] == "strict":
            strict = tokens[i]["value"] == "strict"
            if strict:
                i += 1  # skip "strict"

            # function name
            if tokens[i]["value"] != "function":
                raise Exception("Expected 'function'")
            name = tokens[i+1]["value"]

            # parameters
            params = []
            j = i+3
            while tokens[j]["type"] != "RPAREN":
                if tokens[j]["type"] == "IDENT":
                    params.append(tokens[j]["value"])
                j += 1

            funcs.append({
                "name": name,
                "params": params,
                "strict": strict
            })
        i += 1
    return funcs

def compile_to_json_ir(sprite_name, lines):
    version, file_sprite = parse_metadata(lines)
    if sprite_name != file_sprite:
        raise Exception("Sprite name mismatch")

    code = "\n".join(strip_comments(lines[2:]))
    tokens = tokenize(code)

    ir = {
        "version": version,
        "sprite": sprite_name,
        "globals": parse_globals(tokens),
        "public_vars": parse_public_vars(tokens),
        "sprite_vars": parse_sprite_vars(tokens),
        "events": parse_events(tokens),
        "functions": parse_functions(tokens)
    }

    return json.dumps(ir, indent=4)

def main():
    sprite = input("Sprite name > ")
    path = input("File path > ")

    with open(path, "r") as f:
        lines = f.readlines()

    ir_json = compile_to_json_ir(sprite, lines)
    print(ir_json)

if __name__ == "__main__":
    main()
