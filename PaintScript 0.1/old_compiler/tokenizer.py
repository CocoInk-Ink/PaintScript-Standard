# tokenizer.py

import re

TOKEN_SPEC = [
    # Literals
    ("NUMBER",      r"\d+(\.\d+)?"),
    ("STRING",      r"\".*?\""),

    # Events like @Start, @Keydown, @receive
    ("AT_EVENT",    r"@[A-Za-z_][A-Za-z0-9_]*"),

    # Identifiers and keywords
    ("IDENT",       r"[A-Za-z_][A-Za-z0-9_]*"),

    # Operators
    ("OP",          r"==|!=|<=|>=|&&|\|\||\+|-|\*|/|=|<|>|!"),

    # Punctuation
    ("LPAREN",      r"\("),
    ("RPAREN",      r"\)"),
    ("LBRACE",      r"\{"),
    ("RBRACE",      r"\}"),
    ("LBRACKET",    r"\["),
    ("RBRACKET",    r"\]"),
    ("COLON",       r":"),
    ("SEMICOLON",   r";"),
    ("COMMA",       r","),
    ("DOT",         r"\."),

    # Whitespace
    ("NEWLINE",     r"\n"),
    ("SKIP",        r"[ \t]+"),

    # Anything else is an error
    ("MISMATCH",    r"."),
]

MASTER_REGEX = "|".join(f"(?P<{name}>{pattern})" for name, pattern in TOKEN_SPEC)


def tokenize(code):
    tokens = []

    for match in re.finditer(MASTER_REGEX, code):
        kind = match.lastgroup
        value = match.group()

        if kind in ("SKIP", "NEWLINE"):
            continue

        if kind == "MISMATCH":
            raise SyntaxError(f"Unexpected character: {value}")

        tokens.append({"type": kind, "value": value})

    return tokens
