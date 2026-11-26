// tokens.ts

type TokenLocation = {
	line: number;
	column: number;
	position: number;
};

export type Token =
	| ({ type: "IDENT"; value: string } & TokenLocation)
	| ({ type: "STRING"; value: string } & TokenLocation)
	| ({ type: "NUMBER"; value: number } & TokenLocation)
	| ({ type: "EVENT"; value: string } & TokenLocation)
	| ({ type: "LPAREN"; value: "(" } & TokenLocation)
	| ({ type: "RPAREN"; value: ")" } & TokenLocation)
	| ({ type: "LBRACE"; value: "{" } & TokenLocation)
	| ({ type: "RBRACE"; value: "}" } & TokenLocation)
	| ({ type: "COLON"; value: ":" } & TokenLocation)
	| ({ type: "SEMICOLON"; value: ";" } & TokenLocation)
	| ({ type: "COMMA"; value: "," } & TokenLocation)
	| ({ type: "ASSIGN"; value: "=" } & TokenLocation)
	| ({ type: "ADD"; value: "+" } & TokenLocation)
	| ({ type: "SUB"; value: "-" } & TokenLocation)
	| ({ type: "MUL"; value: "*" } & TokenLocation)
	| ({ type: "DIV"; value: "/" } & TokenLocation)
	| ({ type: "OPTION"; value: string } & TokenLocation)
	| ({ type: "MODIFIER"; value: string } & TokenLocation)
	| ({ type: "VAR" } & TokenLocation)
	| ({ type: "FUNCTION" } & TokenLocation)
	| ({ type: "RETURN" } & TokenLocation)
	| ({ type: "STRICT" } & TokenLocation)
	| ({ type: "CLASSDEF" } & TokenLocation)
	| ({ type: "REPEAT" } & TokenLocation)
	| ({ type: "WHILE" } & TokenLocation)
	| ({ type: "FOR" } & TokenLocation)
	| ({ type: "FOREVER" } & TokenLocation)
	| ({ type: "IN" } & TokenLocation)
	| ({ type: "THEN" } & TokenLocation)
	| ({ type: "UNTIL" } & TokenLocation)
	| ({ type: "EOF" } & TokenLocation);