# compiler.py

import sys
import os
import json
from datetime import datetime

from tokenizer import tokenize
from parser import Parser
from type_checker import check_program


def strip_comments(lines):
    out = []
    in_block = False

    for line in lines:
        raw = line.rstrip("\n")

        if "/*" in raw or "/**" in raw:
            in_block = True

        if in_block:
            if "*/" in raw:
                in_block = False
            continue

        stripped = raw.strip()
        if stripped.startswith("//") or stripped == "":
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


def compile_file(sprite_name, file_path, sessionid):
    # Read file
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Metadata
    version, file_sprite = parse_metadata(lines)
    if sprite_name != file_sprite:
        raise Exception(
            f"Sprite name mismatch. Expected '{sprite_name}', found '{file_sprite}'."
        )

    # Strip comments from body
    body_lines = strip_comments(lines[2:])
    code = "\n".join(body_lines)

    # Tokenize
    tokens = tokenize(code)

    # Parse → AST
    parser = Parser(tokens, version=version, sprite=sprite_name)
    program = parser.parse_program()

    # Type check
    check_program(program)

    # Convert AST → JSON IR
    ir = program.to_dict()

    # Output folder
    out_dir = os.path.join("sessions", sessionid)
    os.makedirs(out_dir, exist_ok=True)

    out_path = os.path.join(out_dir, f"{sprite_name}{datetime.now()}.json")

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(ir, f, indent=4)

    print(f"Compiled → {out_path}")


def link_session(sessionid):
    """
    Later we will merge all JSON files in ./sessions/<sessionid>/ into one program.
    For now, just stub it.
    """
    print(f"Linking session '{sessionid}' (not implemented yet).")


def main():
    args = sys.argv[1:]

    if "--link" in args:
        # Example: python compiler.py --link --session abc123
        if "--session" not in args:
            print("Missing --session <id> for linking.")
            return

        sessionid = args[args.index("--session") + 1]
        link_session(sessionid)
        return

    # Normal compile mode
    if len(args) < 3:
        print("Usage: python compiler.py <SpriteName> <ScriptFile> --session <id>")
        return

    sprite_name = args[0]
    file_path = args[1]

    if "--session" not in args:
        print("Missing --session <id>")
        return

    sessionid = args[args.index("--session") + 1]

    try:
        compile_file(sprite_name, file_path, sessionid)
    except Exception as e:
        print(f"Compilation error: {e}")


if __name__ == "__main__":
    main()
