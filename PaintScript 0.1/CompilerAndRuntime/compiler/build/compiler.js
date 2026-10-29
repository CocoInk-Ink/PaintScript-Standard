"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const file = fs_1.default.readFileSync("Test.pxs");
const CreporsatorOpen = "<--!<--{-";
const CreporsatorClose = "-}-->!-->";
function parse(text) { }
// Clean code before tokenization
function pretokenize(doubleKeys) {
    let inString = false;
    let str = "";
    let strings = [];
    doubleKeys.forEach((lineKeys) => {
        lineKeys;
    });
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
