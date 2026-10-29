import fs from "fs";

const file = fs.readFileSync("Test.pxs");

const CreporsatorOpen = "<--!<--{-";
const CreporsatorClose = "-}-->!-->";

type Creporsator = "<--!<--{-" | "-}-->!-->";

type OP = "call" | "event_call" | "member_call" | "comparator" | "expr" |
	"assign" | "define" | "stopall" | "broadcast" | "broadcastAndWait" | "member_access";

function addCrepersator(item:any) {
	return `${CreporsatorOpen}${item}${CreporsatorClose}`;
}

function parse(text:string) { }

// Clean code before tokenization
function pretokenize(doubleKeys:Array<Array<string>>) {
	let inString:Boolean = false;
	let stringStarter:string = "";
	let str:string = "";
	let strings:Array<string> = [];

	doubleKeys.forEach((lineKeys) => {
		lineKeys.forEach(key => {
			for (let i = 0; i < key.length; i++) {
				let c = key.charAt(i);

				// If we are in a string, then just move on.
				if ((c != '"' && c != "'") && inString) {
					
				}
				
				switch (c) {

					// Strings
					case '"': {
						if (stringStarter != "'" && !inString && key.charAt(i - 1) != "\\") {
							inString = true;
							stringStarter = '"';
						} else if (inString && stringStarter == '"' && key.charAt(i - 1) != "\\") {
							stringStarter = "";
							inString = false;
						}
					} break;

					case "'": {
						if (stringStarter != '"' && !inString && key.charAt(i - 1) != "\\") {
							inString = true;
							stringStarter = "'";
						} else if (inString && stringStarter == "'" && key.charAt(i - 1) != "\\") {
							stringStarter = "";
							inString = false;
						}
					} break;
				}
			}
		});
	});
}

function tokenize(text:string) { }

// Splits at space
function keyget(text:string) {
	let currentKeyword:string = "";
	let keys: Array<string> = [];

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
function lex(text:string) {
	if (text.includes(CreporsatorOpen) || text.includes(CreporsatorClose)) throw new Error("File is not allowed to contain an creporsator!");

	let keys:Array<Array<string>> = [];

	// Get keys line by line
	for (let line of text.split("\n"))
		keys.push(keyget(line));

	return pretokenize(keys);
}

// Code:

console.log(lex(file.toString()));