import fs from "fs";

const file = fs.readFileSync("Test.pxs");

const CreporsatorOpen = "<--!<--{-";
const CreporsatorClose = "-}-->!-->";

type Creporsator = "<--!<--{-" | "-}-->!-->";

type OP = "call" | "event_call" | "member_call" | "comparator" | "expr" |
	"assign" | "define" | "stopall" | "broadcast" | "broadcastAndWait" | "member_access";

function addCrepersator(item: any) {
	return `${CreporsatorOpen}${item}${CreporsatorClose}`;
}

function parse(text: string) { }

// Clean code before tokenization
function pretokenize(doubleKeys: Array<Array<string>>) {
	let inString: Boolean = false;
	let stringStarter: string = "";
	let str: string = "";
	let strings: Array<string> = [];

	let isEscaped: Boolean = false;

	doubleKeys.forEach((lineKeys) => {
		lineKeys.forEach(key => {
			for (let i = 0; i < key.length; i++) {
				function isSafe() {
					if (isEscaped) return false;
					else if (key.charAt(i - 1) == "\\") return str.charAt(str.length - 1) == "\\";
					else return true;
				}

				let c = key.charAt(i);

				// If we are in a string, then just move on.
				if ((c != '"' && c != "'" && (c != "\\" && !isEscaped)) && inString) {
					str += c;
					continue;
				}

				switch (c) {
					case "\\":
						isEscaped = true;
						continue;

					// Strings
					case '"': {
						if (stringStarter != "'" && !inString && isSafe()) {
							// Open string.

							inString = true;
							stringStarter = '"';
						} else if (inString && stringStarter == '"' && isSafe()) {
							// Close string.

							stringStarter = "";
							inString = false;

							strings.push(str);
							str = "";
						}
					} break;

					case "'": {
						if (stringStarter != '"' && !inString && isSafe()) {
							inString = true;
							stringStarter = "'";
						} else if (inString && stringStarter == "'" && isSafe()) {
							stringStarter = "";
							inString = false;

							strings.push(str);
							str = "";
						}
					} break;
				}

				// After, reset the escape:
				isEscaped = false;
			}
		});

		if (inString) throw new Error("String not ended after newline!");

		// Reset string on newline
		inString = false;
		stringStarter = "";
		str = "";
	});

	return strings;
}

function tokenize(text: string) { }

// Splits at space
function keyget(text: string) {
	let currentKeyword: string = "";
	let keys: Array<string> = [];

	let inString: Boolean = false;
	let stringStarter: string = "";

	for (var i = 0; i < text.length; i++) {
		// Get keyword.
		while (!((text.charAt(i) == ' ' && ((text.charAt(i) != "\\" && text.charAt(i - 1) != "\\")) && (!inString)) || i >= text.length)) {
			currentKeyword += text.charAt(i);

			if (text.charAt(i) == "\\" && text.charAt(i - 1) != "\\") { i++; continue; }
			if (text.charAt(i) == '\\')
				if (text.charAt(i - 1) != "\\" && text.charAt(i - 2) != "\\") {

					// Check if we are starting or ending a string.
					if (text.charAt(i) == "'" || text.charAt(i) == '"') {
						if (!inString) {
							// Starting
							stringStarter = text.charAt(i);
							inString = true;
						} else if (stringStarter == text.charAt(i)) {
							// Ending
							stringStarter = "";
							inString = false;
						}
					}


				}

			console.log(currentKeyword, text.charAt(i), i);
			i++; // DO Last!
		}

		keys.push(currentKeyword);
		currentKeyword = "";
	}

	return keys;
}

// Return pretokenized keys
function lex(text: string) {
	if (text.includes(CreporsatorOpen) || text.includes(CreporsatorClose)) throw new Error("File is not allowed to contain an creporsator!");

	let keys: Array<Array<string>> = [];

	// Get keys line by line
	for (let line of text.split("\n"))
		keys.push(keyget(line));

	return pretokenize(keys);
}

// Code:

console.log(lex(file.toString()));