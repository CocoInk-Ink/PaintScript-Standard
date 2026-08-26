# tokenizer.py

import re

TOKEN_SPEC = [
    ("NUMBER",      r"\d+(\.\d+)?"),
    ("STRING",      r"\".*?\""),
    ("IDENT",       r"[A-Za-z_][A-Za-z0-9_]*"),
    ("AT_EVENT",    r"@[A-Za-z_][A-Za-z0-9_]*"),
    ("OP",          r"==|!=|<=|>=|\+\+|--|\+|-|\*|/|=|<|>"),
    ("LPAREN",      r"\("),
    ("RPAREN",      r"\)"),
    ("LBRACE",      r"\{"),
    ("RBRACE",      r"\}"),
    ("COLON",       r":"),
    ("SEMICOLON",   r";"),
    ("COMMA",       r","),
    ("NEWLINE",     r"\n"),
    ("SKIP",        r"[ \t]+"),
    ("MISMATCH",    r"."),
]

MASTER_REGEX = "|".join(f"(?P<{name}>{pattern})" for name, pattern in TOKEN_SPEC)

def tokenize(code):
    tokens = []
    for match in re.finditer(MASTER_REGEX, code):
        kind = match.lastgroup
        value = match.group()

        if kind == "SKIP" or kind == "NEWLINE":
            continue
        elif kind == "MISMATCH":
            raise SyntaxError(f"Unexpected character: {value}")
        else:
            tokens.append({"type": kind, "value": value})
    return tokens
