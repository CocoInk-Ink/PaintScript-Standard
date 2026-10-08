// tokenizer.js

const TOKEN_SPEC = [
    // Literals
    ["NUMBER", /\d+(\.\d+)?/y],
    ["STRING", /"[^"]*"|'[^']*'/y],

    // Events like @Start, @Keydown, @Receive
    ["AT_EVENT", /@[A-Za-z_][A-Za-z0-9_]*/y],

    // Identifiers and keywords
    ["IDENT", /[A-Za-z_][A-Za-z0-9_]*/y],

    // Operators
    ["OP", /==|!=|<=|>=|&&|\|\||\+|-|\*|\/|=|<|>/y],

    // Punctuation
    ["LPAREN", /\(/y],
    ["RPAREN", /\)/y],
    ["LBRACE", /\{/y],
    ["RBRACE", /\}/y],
    ["LBRACKET", /\[/y],
    ["RBRACKET", /\]/y],
    ["COLON", /:/y],
    ["SEMICOLON", /;/y],
    ["COMMA", /,/y],
    ["DOT", /\./y],

    // Whitespace
    ["NEWLINE", /\n/y],
    ["SKIP", /[ \t\r]+/y],

    // Anything else is an error
    ["MISMATCH", /./y]
];

export function tokenize(code) {
    const tokens = [];
    let pos = 0;

    while (pos < code.length) {
        let matched = false;

        for (const [kind, regex] of TOKEN_SPEC) {
            regex.lastIndex = pos;
            const m = regex.exec(code);
            if (!m) continue;

            matched = true;
            const value = m[0];

            if (kind === "SKIP" || kind === "NEWLINE") {
                pos = regex.lastIndex;
                break;
            }

            if (kind === "MISMATCH") {
                throw new SyntaxError(`Unexpected character: ${value}`);
            }

            tokens.push({ type: kind, value });
            pos = regex.lastIndex;
            break;
        }

        if (!matched) {
            throw new SyntaxError(`Unexpected character at position ${pos}`);
        }
    }

    return tokens;
}
