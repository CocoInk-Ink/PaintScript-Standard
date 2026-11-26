// parse.ts

import type { Token } from "./tokens.js";
import {
	ProgramNode, StatementNode, VariableDeclarationNode,
	ExpressionNode, NumberLiteralNode, StringLiteralNode,
	IdentifierNode, FunctionDeclarationNode,
	DeclarationNode,
	EventDeclarationNode, ReturnStatementNode
} from "./ast.js";

export function parse(tokens: Token[]): ProgramNode {

	let i = 0;

	function current(): Token {
		return tokens[i];
	}

	function advance(): Token {
		i++;
		return tokens[i];
	}

	function expect<T extends Token["type"]>(
		type: T
	): Extract<Token, { type: T }> {

		const token = current();

		if (token.type !== type) {
			throw new Error(
				`Expected ${type} at line ${token.line}, column ${token.column}`
			);
		}

		advance();

		return token as Extract<Token, { type: T }>;
	}

	const declarations: DeclarationNode[] = [];

	const options: {
		name: string;
		value: string;
	}[] = [];

	while (current().type === "OPTION") {

		const key = expect("OPTION");
		const value = expect("IDENT");

		options.push({
			name: key.value,
			value: value.value
		});
	}

	// Main loop, top level statements only (Events, Vars, and Functions)
	while (current().type !== "EOF") {

		let mods: string[] = [];

		if (current().type === "EVENT") {
			declarations.push(parseEvent());
			continue;
		}

		if (current().type === "MODIFIER") {
			mods = parseModifiers();
		}

		if (current().type === "FUNCTION") {
			declarations.push(parseFunction(mods));
			continue;
		}

		if (current().type === "VAR") {
			declarations.push(parseVariable(mods));
			continue;
		}

		advance();
	}

	return {
		type: "Program",
		options,
		declarations
	};

	function parseModifiers(): string[] {
		const modifiers: string[] = [];

		while (current().type === "MODIFIER") {
			modifiers.push(current().value);
			advance();
		}

		return modifiers;
	}

	function parseStatement(): StatementNode {

		if (current().type === "VAR") {
			return parseVariable();
		}

		if (current().type === "FUNCTION") {
			return parseFunction();
		}

		if (current().type === "RETURN") {
			return parseReturn();
		}

		// later:
		// return parseExpressionStatement();

		throw new Error(
			`Unexpected token ${current().type} at line ${current().line}, column ${current().column}`
		);
	}

	function parseEvent(): EventDeclarationNode {

		const event = expect("EVENT");

		expect("LBRACE");

		const body: StatementNode[] = [];

		while (
			current().type !== "RBRACE" &&
			current().type !== "EOF"
		) {
			body.push(parseStatement());
		}

		expect("RBRACE");

		return {
			type: "EventDeclaration",
			name: event.value,
			body
		};
	}

	function parseFunction(modifiers: string[] = []): FunctionDeclarationNode {
		expect("FUNCTION");
		const name = expect("IDENT").value;

		const params: string[] = [];

		// Params
		expect("LPAREN");

		while (current().type !== "RPAREN" && current().type !== "EOF") {
			params.push(expect("IDENT").value);
			if (current().type === "COMMA") {
				advance();
			}
		}

		expect("RPAREN");

		expect("LBRACE");

		// Body
		const body: StatementNode[] = [];
		while (
			current().type !== "RBRACE" &&
			current().type !== "EOF"
		) {
			body.push(parseStatement());
		}

		expect("RBRACE");

		return {
			type: "FunctionDeclaration",
			name,
			body,
			params,
			modifiers: modifiers
		};
	}

	function parseVariable(modifiers: string[] = []): VariableDeclarationNode {

		expect("VAR");

		const name = expect("IDENT");

		expect("ASSIGN");

		const value = parseExpression();

		expect("SEMICOLON");

		return {
			type: "VariableDeclaration",
			name: name.value,
			value,
			modifiers
		};
	}

	function parseExpression(): ExpressionNode {

		const token = current();

		switch (token.type) {

			case "NUMBER":
				advance();

				return {
					type: "NumberLiteral",
					value: token.value
				};

			case "STRING":
				advance();

				return {
					type: "StringLiteral",
					value: token.value
				};

			case "IDENT": {

				advance();

				if (current().type === "LPAREN") {

					expect("LPAREN");

					const args: ExpressionNode[] = [];

					while (
						current().type !== "RPAREN" &&
						current().type !== "EOF"
					) {

						args.push(
							parseExpression()
						);

						if (current().type === "COMMA") {
							advance();
						}
					}

					expect("RPAREN");

					return {
						type: "CallExpression",
						name: token.value,
						args
					};
				}

				return {
					type: "Identifier",
					name: token.value
				};
			}

			default:
				throw new Error(
					`Unexpected token ${token.type} at line ${token.line}, column ${token.column}`
				);
		}
	}

	function parseReturn(): ReturnStatementNode {

		expect("RETURN");

		const value = parseExpression();

		expect("SEMICOLON");

		return {
			type: "ReturnStatement",
			value
		};
	}
}