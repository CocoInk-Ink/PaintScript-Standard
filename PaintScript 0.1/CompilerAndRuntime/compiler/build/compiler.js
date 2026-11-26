"use strict";
// compiler.ts
// Compile to a json ir that gets linked then interpreted by a vm
// This file compiles a single file at a time.
Object.defineProperty(exports, "__esModule", { value: true });
function isDigit(c) {
    return c >= "0" && c <= "9";
}
function isAlpha(c) {
    return ((c >= "a" && c <= "z") ||
        (c >= "A" && c <= "Z") ||
        c === "_");
}
function isWhitespace(c) {
    return c === " " ||
        c === "\t" ||
        c === "\n" ||
        c === "\r";
}
function isNewline(c) {
    return c === "\n";
}
function makeToken(token) {
    return token;
}
function lex(source) {
    const tokens = [];
    let i = 0;
    let line = 1;
    let column = 1;
    let terminated = false;
    while (i < source.length) {
        const c = source[i];
        // Skip whitespace
        if (c === "\n") {
            line++;
            column = 1;
            i++;
            continue;
        }
        if (c === " " || c === "\t" || c === "\r") {
            i++;
            column++;
            continue;
        }
        // Single line comments
        if (c === "/" &&
            source[i + 1] === "/") {
            while (i < source.length &&
                source[i] !== "\n") {
                i++;
                column++;
            }
            continue;
        }
        // PaintScript options like version and current sprite.
        if (c === "#") {
            const startLine = line;
            const startColumn = column;
            const startPosition = i;
            i++;
            column++;
            // Key
            let value = "";
            while (i < source.length &&
                !isWhitespace(source[i])) {
                value += source[i];
                i++;
                column++;
            }
            tokens.push({
                type: "OPTION",
                value,
                line: startLine,
                column: startColumn,
                position: startPosition
            });
            // Value
            value = "";
            // Skip empty space
            while (i < source.length &&
                (source[i] === " " || source[i] === "\t")) {
                i++;
                column++;
            }
            const startLine2 = line;
            const startColumn2 = column;
            const startPosition2 = i;
            while (i < source.length &&
                !isNewline(source[i])) {
                value += source[i];
                i++;
                column++;
            }
            tokens.push({
                type: "IDENT",
                value,
                line: startLine2,
                column: startColumn2,
                position: startPosition2
            });
            continue;
        }
        // Event names
        if (c === "@") {
            const startLine = line;
            const startColumn = column;
            const startPosition = i;
            i++;
            column++;
            let name = "";
            while (i < source.length &&
                (isAlpha(source[i]) || isDigit(source[i]))) {
                name += source[i];
                i++;
                column++;
            }
            tokens.push({
                type: "EVENT",
                value: name,
                line: startLine,
                column: startColumn,
                position: startPosition
            });
            continue;
        }
        // Strings
        if (c === '"' || c === "'") {
            const startLine = line;
            const startColumn = column;
            const startPosition = i;
            const quote = c;
            i++;
            column++;
            let value = "";
            while (i < source.length) {
                const current = source[i];
                if (current === "\\") {
                    i++;
                    column++;
                    if (i >= source.length)
                        throw new Error(`Invalid escape sequence at line ${line}, column ${column}`);
                    value += source[i];
                    i++;
                    column++;
                    continue;
                }
                if (current === quote) {
                    i++;
                    column++;
                    break;
                }
                if (current === "\n") {
                    line++;
                    column = 1;
                }
                else {
                    column++;
                }
                value += current;
                i++;
            }
            tokens.push({
                type: "STRING",
                value,
                line: startLine,
                column: startColumn,
                position: startPosition
            });
            continue;
        }
        // Numbers
        if (isDigit(c)) {
            const startLine = line;
            const startColumn = column;
            const startPosition = i;
            let value = "";
            while (i < source.length &&
                (isDigit(source[i]) || source[i] === ".")) {
                value += source[i];
                i++;
                column++;
            }
            tokens.push({
                type: "NUMBER",
                value: parseFloat(value),
                line: startLine,
                column: startColumn,
                position: startPosition
            });
            continue;
        }
        // Identifiers
        if (isAlpha(c)) {
            const startLine = line;
            const startColumn = column;
            const startPosition = i;
            let value = "";
            while (i < source.length &&
                (isAlpha(source[i]) || isDigit(source[i]))) {
                value += source[i];
                i++;
                column++;
            }
            // Parse keywords
            switch (value) {
                case "var":
                    tokens.push({
                        type: "VAR",
                        line: startLine,
                        column: startColumn,
                        position: startPosition
                    });
                    break;
                case "function":
                    tokens.push({
                        type: "FUNCTION",
                        line: startLine,
                        column: startColumn,
                        position: startPosition
                    });
                    break;
                case "return":
                    tokens.push({
                        type: "RETURN",
                        line: startLine,
                        column: startColumn,
                        position: startPosition
                    });
                    break;
                case "strict":
                    tokens.push({
                        type: "STRICT",
                        line: startLine,
                        column: startColumn,
                        position: startPosition
                    });
                    break;
                case "class":
                    tokens.push({
                        type: "CLASSDEF",
                        line: startLine,
                        column: startColumn,
                        position: startPosition
                    });
                    break;
                // Identifier
                default:
                    tokens.push({
                        type: "IDENT",
                        value,
                        line: startLine,
                        column: startColumn,
                        position: startPosition
                    });
            }
            continue;
        }
        // Single-character symbols
        switch (c) {
            case "(":
                tokens.push({
                    type: "LPAREN",
                    value: "(",
                    line,
                    column,
                    position: i
                });
                break;
            case ")":
                tokens.push({
                    type: "RPAREN",
                    value: ")",
                    line,
                    column,
                    position: i
                });
                break;
            case "{":
                tokens.push({
                    type: "LBRACE",
                    value: "{",
                    line,
                    column,
                    position: i
                });
                break;
            case "}":
                tokens.push({
                    type: "RBRACE",
                    value: "}",
                    line,
                    column,
                    position: i
                });
                break;
            case ":":
                tokens.push({
                    type: "COLON",
                    value: ":",
                    line,
                    column,
                    position: i
                });
                break;
            case ";":
                tokens.push({
                    type: "SEMICOLON",
                    value: ";",
                    line,
                    column,
                    position: i
                });
                break;
            case ",":
                tokens.push({
                    type: "COMMA",
                    value: ",",
                    line,
                    column,
                    position: i
                });
                break;
            case "=":
                tokens.push({
                    type: "ASSIGN",
                    value: "=",
                    line,
                    column,
                    position: i
                });
                break;
            case "+":
                tokens.push({
                    type: "ADD",
                    value: "+",
                    line,
                    column,
                    position: i
                });
                break;
            case "-":
                tokens.push({
                    type: "SUB",
                    value: "-",
                    line,
                    column,
                    position: i
                });
                break;
            case "*":
                tokens.push({
                    type: "MUL",
                    value: "*",
                    line,
                    column,
                    position: i
                });
                break;
            case "/":
                tokens.push({
                    type: "DIV",
                    value: "/",
                    line,
                    column,
                    position: i
                });
                break;
            default:
                throw new Error(`Unexpected character '${c}' at line ${line}, column ${column}`);
        }
        i++;
        column++;
    }
    tokens.push({
        type: "EOF",
        line,
        column,
        position: i
    });
    return tokens;
}
const code = `
#PaintScript 0.1
#Sprite Sprite_1

@Start {
    say("Hello, World!"); // Same as this.say or Sprite_1.say
	var hello = "Hello!";

	say(hello);
	var var1 = 3;
	var var2 = 7;

	var sum = add(var1, var2);
	say(sum);
}

strict function add(num1, num2) {
	return num1 + num2;
}
`;
console.log(lex(code));
