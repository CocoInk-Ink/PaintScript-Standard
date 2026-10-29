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
    doubleKeys.forEach((lineKeys) => {
        lineKeys.forEach(key => {
            for (let i = 0; i < key.length; i++) {
                let c = key.charAt(i);
                // If we are in a string, then just move on.
                if ((c != '"' && c != "'" && (c != "\\" && key.charAt(i - 1) != "\\")) && inString) {
                    str += c;
                    continue;
                }
                switch (c) {
                    // Strings
                    case '"':
                        {
                            if (stringStarter != "'" && !inString && key.charAt(i - 1) != "\\") {
                                // Open string.
                                inString = true;
                                stringStarter = '"';
                            }
                            else if (inString && stringStarter == '"' && key.charAt(i - 1) != "\\") {
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
                            if (stringStarter != '"' && !inString && key.charAt(i - 1) != "\\") {
                                inString = true;
                                stringStarter = "'";
                            }
                            else if (inString && stringStarter == "'" && key.charAt(i - 1) != "\\") {
                                stringStarter = "";
                                inString = false;
                                strings.push(str);
                                str = "";
                            }
                        }
                        break;
                }
            }
        });
    });
    return strings;
}
function tokenize(text) { }
// Splits at space
function keyget(text) {
    let currentKeyword = "";
    let keys = [];
    for (var i = 0; i < text.length; i++) {
        // Get word.
        while (!(text.charAt(i) == ' ' || i >= text.length)) {
            currentKeyword += text.charAt(i);
            i++;
            console.log(currentKeyword, text.charAt(i), i);
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
    return pretokenize(keys);
}
// Code:
console.log(lex(file.toString()));
