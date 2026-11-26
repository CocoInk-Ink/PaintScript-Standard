// parse.ts

import { Token } from "./tokens.js";
import { ProgramNode, StatementNode, VariableDeclarationNode,
	ExpressionNode, NumberLiteralNode, StringLiteralNode, IdentifierNode } from "./ast.js";

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

	const body: StatementNode[] = [];

	while (current().type !== "EOF") {

		if (current().type === "VAR") {
			body.push(parseVariable());
			continue;
		}

		advance();
	}

	return {
		type: "Program",
		body
	};

	function parseVariable(): VariableDeclarationNode {

		expect("VAR");

		const name = expect("IDENT");

		expect("ASSIGN");

		const value = parseExpression();

		expect("SEMICOLON");

		return {
			type: "VariableDeclaration",
			name: name.value,
			value
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

			case "IDENT":
				advance();

				return {
					type: "Identifier",
					name: token.value
				};

			default:
				throw new Error(
					`Unexpected token ${token.type} at line ${token.line}, column ${token.column}`
				);
		}
	}
}