# compiler.py

import sys
import os
import json
from datetime import datetime

from tokenizer import tokenize
from parser import Parser
from type_checker import check_program
from linker import link_session


def strip_comments(lines):
    out = []
    in_block = False

    for line in lines:
        raw = line.rstrip("\n")

        # block comments
        if "/*" in raw or "/**" in raw:
            in_block = True

        if in_block:
            if "*/" in raw:
                in_block = False
            continue

        # inline // comments
        if "//" in raw:
            raw = raw.split("//", 1)[0]

        stripped = raw.strip()
        if stripped == "":
            continue

        out.append(raw)

    return out


def parse_metadata(lines):
    if len(lines) < 2:
        raise Exception("File missing metadata header.")

    paint = lines[0].strip()
    sprite = lines[1].strip()

    if not paint.startswith("#PaintScript"):
        raise Exception("Missing #PaintScript metadata.")
    if not sprite.startswith("#Sprite"):
        raise Exception("Missing #Sprite metadata.")

    version = paint.split(" ", 1)[1].strip()
    sprite_name = sprite.split(" ", 1)[1].strip()

    return version, sprite_name


def compile_file(sprite_name, instance_name, file_path, sessionid):
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    version, file_sprite = parse_metadata(lines)
    if instance_name != file_sprite:
        raise Exception(
            f"Sprite name mismatch. Expected '{instance_name}', found '{file_sprite}'."
        )

    body_lines = strip_comments(lines[2:])
    code = "\n".join(body_lines)

    tokens = tokenize(code)

    parser = Parser(tokens, version=version, sprite=sprite_name, instance=instance_name)
    program = parser.parse_program()

    check_program(program)

    ir = program.to_dict()

    out_dir = os.path.join("sessions", sessionid)
    os.makedirs(out_dir, exist_ok=True)

    out_path = os.path.join(out_dir, f"{instance_name}{datetime.now().timestamp()}.json")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(ir, f, indent=4)

    print(f"Compiled → {out_path}")

def main():
    args = sys.argv[1:]

    if "--link" in args:
        if "--session" not in args:
            print("Missing --session <id> for linking.")
            return

        sessionid = args[args.index("--session") + 1]
        link_session(sessionid)
        return

    if len(args) < 4:
        print("Usage: python compiler.py <SpriteName> <InstanceName> <ScriptFile> --session <id>")
        return

    sprite_name = args[0]      # display name
    instance_name = args[1]    # safe code name
    file_path = args[2]

    if "--session" not in args:
        print("Missing --session <id>")
        return

    sessionid = args[args.index("--session") + 1]

    try:
        compile_file(sprite_name, instance_name, file_path, sessionid)
    except Exception as e:
        print(f"Compilation error: {e}")


if __name__ == "__main__":
    main()
