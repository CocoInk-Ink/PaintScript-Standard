// compiler.ts

type TokenLocation = {
	line: number;
	column: number;
	position: number;
};

type Token =
	| ({ type: "IDENT"; value: string } & TokenLocation)
	| ({ type: "STRING"; value: string } & TokenLocation)
	| ({ type: "NUMBER"; value: number } & TokenLocation)
	| ({ type: "EVENT"; value: string } & TokenLocation)
	| ({ type: "LPAREN"; value: "(" } & TokenLocation)
	| ({ type: "RPAREN"; value: ")" } & TokenLocation)
	| ({ type: "LBRACE"; value: "{" } & TokenLocation)
	| ({ type: "RBRACE"; value: "}" } & TokenLocation)
	| ({ type: "SEMICOLON"; value: ";" } & TokenLocation)
	| ({ type: "COMMA"; value: "," } & TokenLocation)
	| ({ type: "ASSIGN"; value: "=" } & TokenLocation)
	| ({ type: "ADD"; value: "+" } & TokenLocation)
	| ({ type: "SUB"; value: "-" } & TokenLocation)
	| ({ type: "MUL"; value: "*" } & TokenLocation)
	| ({ type: "DIV"; value: "/" } & TokenLocation)
	| ({ type: "VAR" } & TokenLocation)
	| ({ type: "FUNCTION" } & TokenLocation)
	| ({ type: "RETURN" } & TokenLocation)
	| ({ type: "STRICT" } & TokenLocation)
	| ({ type: "EOF" } & TokenLocation);

function isDigit(c: string): boolean {
	return c >= "0" && c <= "9";
}

function isAlpha(c: string): boolean {
	return (
		(c >= "a" && c <= "z") ||
		(c >= "A" && c <= "Z") ||
		c === "_"
	);
}

function isWhitespace(c: string): boolean {
	return c === " " ||
		c === "\t" ||
		c === "\n" ||
		c === "\r";
}

function makeToken<T extends Token>(
    token: T
): T {
    return token;
}

function lex(source: string): Token[] {
	const tokens: Token[] = [];

	let i = 0;
	let line = 1;
	let column = 1;

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

		// Event names
		if (c === "@") {
			const startLine = line;
			const startColumn = column;
			const startPosition = i;

			i++;
			column++;

			let name = "";

			while (
				i < source.length &&
				(isAlpha(source[i]) || isDigit(source[i]))
			) {
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
						throw new Error(
							`Invalid escape sequence at line ${line}, column ${column}`
						);

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
				} else {
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

			while (
				i < source.length &&
				(isDigit(source[i]) || source[i] === ".")
			) {
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

			while (
				i < source.length &&
				(isAlpha(source[i]) || isDigit(source[i]))
			) {
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
				throw new Error(
					`Unexpected character '${c}' at line ${line}, column ${column}`
				);
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
@Start {
    say("Hello, World!");
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