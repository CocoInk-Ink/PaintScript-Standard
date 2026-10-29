"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const file = fs_1.default.readFileSync("Test.pxs");
const CreporsatorOpen = "<--!<--{-";
const CreporsatorClose = "-}-->!-->";
function addCrepersator(item) {
    return `${CreporsatorOpen}${item}${CreporsatorClose}`;
}
function parse(text) { }
// Clean code before tokenization
function pretokenize(doubleKeys) {
    let inString = false;
    let stringStarter = "";
    let str = "";
    let strings = [];
    let isEscaped = false;
    doubleKeys.forEach((lineKeys) => {
        lineKeys.forEach(key => {
            for (let i = 0; i < key.length; i++) {
                // Check if last character was a backslash, if it was, check if it was escaped.
                function isSafe() {
                    return !isEscaped;
                }
                let c = key.charAt(i);
                if (c == "\\" && isEscaped) {
                    str += c;
                    continue;
                }
                // If we are in a string, then just move on.
                if ((c != '"' && c != "'" && (c != "\\" && isSafe())) && inString) {
                    str += c;
                    continue;
                }
                switch (c) {
                    case "\\":
                        isEscaped = true;
                        continue;
                    // Strings
                    case '"':
                        {
                            if (stringStarter != "'" && !inString && isSafe()) {
                                // Open string.
                                inString = true;
                                stringStarter = '"';
                            }
                            else if (inString && stringStarter == '"' && isSafe()) {
                                // Close string.
                                stringStarter = "";
                                inString = false;
                                strings.push(str);
                                str = "";
                            }
                        }
                        break;
                    case "'":
                        {
                            if (stringStarter != '"' && !inString && isSafe()) {
                                inString = true;
                                stringStarter = "'";
                            }
                            else if (inString && stringStarter == "'" && isSafe()) {
                                stringStarter = "";
                                inString = false;
                                strings.push(str);
                                str = "";
                            }
                        }
                        break;
                }
                // After, reset the escape:
                isEscaped = false;
            }
        });
        console.log(str);
        if (inString)
            throw new Error("String not ended after newline!");
        // Reset string on newline
        inString = false;
        stringStarter = "";
        str = "";
    });
    return strings;
}
function tokenize(text) { }
// Splits at space
function keyget(text) {
    let currentKeyword = "";
    let keys = [];
    let inString = false;
    let stringStarter = "";
    let isEscaped = false;
    for (var i = 0; i < text.length; i++) {
        // Check if last character was a backslash, if it was, check if it was escaped.
        function isSafe() {
            return !isEscaped;
        }
        // Get keyword.
        while (!((text.charAt(i) == ' ' && !inString) || i >= text.length)) {
            if (text.charAt(i) == "\\" && isSafe()) {
                isEscaped = true;
                console.log(currentKeyword, text.charAt(i), i, `isEscaped: ${isEscaped}`, `inString: ${inString}`);
                i++;
                continue;
            }
            // Backslash is escaped.
            if (text.charAt(i) == "\\") {
                currentKeyword += "\\\\"; // Add two backslashes for pretokenizer.
                console.log(currentKeyword, text.charAt(i), i, `isEscaped: ${isEscaped}`, `inString: ${inString}`);
                isEscaped = false;
                i++;
                continue;
            }
            currentKeyword += text.charAt(i);
            if (text.charAt(i) == '\\') { }
            if (isSafe()) {
                // Check if we are starting or ending a string.
                if (text.charAt(i) == "'" || text.charAt(i) == '"') {
                    if (!inString) {
                        // Starting
                        stringStarter = text.charAt(i);
                        inString = true;
                    }
                    else if (stringStarter == text.charAt(i)) {
                        // Ending
                        stringStarter = "";
                        inString = false;
                    }
                }
            }
            console.log(currentKeyword, text.charAt(i), i, `isEscaped: ${isEscaped}`, `inString: ${inString}`);
            isEscaped = false; // Important!
            i++; // DO Last! Important!
        }
        keys.push(currentKeyword);
        currentKeyword = "";
    }
    return keys;
}
// Return pretokenized keys
function lex(text) {
    if (text.includes(CreporsatorOpen) || text.includes(CreporsatorClose))
        throw new Error("File is not allowed to contain an creporsator!");
    let keys = [];
    // Get keys line by line
    for (let line of text.split("\n"))
        keys.push(keyget(line));
    console.log(`Keys: ${keys}`);
    return pretokenize(keys);
}
// Code:
console.log(lex(file.toString()));
