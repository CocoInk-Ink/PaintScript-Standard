# compiler.py

import sys
import json

from tokenizer import tokenize
from parser import Parser
from type_checker import check_program


def strip_comments(lines):
    """
    Remove block comments (/* ... */, /** ... */) and // single-line comments.
    Return a list of code lines without comments or empty lines.
    """
    out = []
    in_block = False

    for line in lines:
        raw = line.rstrip("\n")

        # Start of block comment
        if "/*" in raw or "/**" in raw:
            in_block = True

        # If currently inside a block comment, skip until we see the end
        if in_block:
            if "*/" in raw:
                in_block = False
            continue

        # Single-line comment
        stripped = raw.strip()
        if stripped.startswith("//"):
            continue

        # Skip empty lines
        if stripped == "":
            continue

        out.append(raw)

    return out


def parse_metadata(lines):
    """
    Expect:
        #PaintScript {version}
        #Sprite {sprite_name}
    on the first two lines.
    """
    if len(lines) < 2:
        raise Exception("File too short, missing metadata.")

    paint = lines[0].strip()
    sprite = lines[1].strip()

    if not paint.startswith("#PaintScript"):
        raise Exception("Missing #PaintScript metadata line.")
    if not sprite.startswith("#Sprite"):
        raise Exception("Missing #Sprite metadata line.")

    version = paint.split(" ", 1)[1].strip()
    sprite_name = sprite.split(" ", 1)[1].strip()

    return version, sprite_name


def compile_file(expected_sprite_name, file_path):
    # Read file
    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Metadata
    version, sprite_name = parse_metadata(lines)

    if sprite_name != expected_sprite_name:
        raise Exception(
            f"Sprite name mismatch. Expected '{expected_sprite_name}', found '{sprite_name}'."
        )

    # Strip comments from the body (everything after metadata)
    body_lines = strip_comments(lines[2:])
    code = "\n".join(body_lines)

    # Tokenize
    tokens = tokenize(code)

    # Parse into AST (Program)
    parser = Parser(tokens, version=version, sprite=sprite_name)
    program = parser.parse_program()
    
    # type check
    check_program(program)

    # Convert AST to JSON IR
    ir = program.to_dict()
    return json.dumps(ir, indent=4)


def main():
    if len(sys.argv) < 3:
        print("Usage: python compiler.py <SpriteName> <ScriptFile>")
        return

    sprite_name = sys.argv[1]
    file_path = sys.argv[2]

    try:
        ir_json = compile_file(sprite_name, file_path)
        print(ir_json)
    except Exception as e:
        print(f"Compilation error: {e}")


if __name__ == "__main__":
    main()
