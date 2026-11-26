// ast.ts

export type ProgramNode = {
	type: "Program";

	options: {
		name: string;
		value: string;
	}[];

	declarations: DeclarationNode[];
}

// Top level declarations
export type DeclarationNode =
	| EventDeclarationNode
	| FunctionDeclarationNode
	| VariableDeclarationNode;

export type StatementNode =
	| VariableDeclarationNode
	| FunctionDeclarationNode
	| ReturnStatementNode
	| ExpressionStatementNode;

export type ReturnStatementNode = {
	type: "ReturnStatement";
	value: ExpressionNode;
};

export type ExpressionStatementNode = {
	type: "ExpressionStatement";
	expression: ExpressionNode;
};

export type EventDeclarationNode = {
	type: "EventDeclaration";
	name: string;
	body: StatementNode[];
};

export type VariableDeclarationNode = {
	type: "VariableDeclaration";
	name: string;
	value: ExpressionNode;
	modifiers: string[];
};

export type FunctionDeclarationNode = {
	type: "FunctionDeclaration";
	name: string;
	modifiers: string[];
	params: string[];
	body: StatementNode[];
};

export type ExpressionNode =
	| NumberLiteralNode
	| StringLiteralNode
	| IdentifierNode
	| CallExpressionNode
	| BinaryExpressionNode;

export type CallExpressionNode = {
	type: "CallExpression";
	name: string;
	args: ExpressionNode[];
};

export type BinaryExpressionNode = {
    type: "BinaryExpression";
    operator: "+" | "-" | "*" | "/";
    left: ExpressionNode;
    right: ExpressionNode;
};

export type NumberLiteralNode = {
	type: "NumberLiteral";
	value: number;
};

export type StringLiteralNode = {
	type: "StringLiteral";
	value: string;
};

export type IdentifierNode = {
	type: "Identifier";
	name: string;
};