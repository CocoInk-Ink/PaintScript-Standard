// ast.ts

export type ProgramNode = {
    type: "Program";
    body: StatementNode[];
};

export type StatementNode =
    | VariableDeclarationNode;

export type VariableDeclarationNode = {
    type: "VariableDeclaration";
    name: string;
    value: ExpressionNode;
};

export type ExpressionNode =
    | NumberLiteralNode
    | StringLiteralNode
    | IdentifierNode;

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