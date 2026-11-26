// compiler.ts

import { lex } from "./lexer";
import { parse } from "./parser";

const code = `
#PaintScript 0.1
#Sprite Sprite_1

global var name = "Nino";
global var f = function() {};
global function func():void {}
private var var1:Number = 4;
private var var2;
public const a = 5;

@Keyup(key:KeyboardKey) {}
@Keydown(key:KeyboardKey) {}

// Any key up or down
@Keydown {}
@Keyup {}

@Start {
	var1 = 7;

	if (condition) {}
	if (condition) then {}
	else {}

	if () {} else then {}
	if () then {} else then {}

	if () ;
	if () then ;

	if () ;
	else ;

	if () then ;
	else ;

	if () then ;
	else then ;

	repeat(300) {}

	// Backwards while loop
	repeat until() {}

	forever {}

	Broadcast message1;
	BroadcastAndWait message1;
}

// Messages are not declared, only handled, meaning you could have as many handlers as you want for the same message

@receive message1 {}

// Activates on either message
@receive message1, message2 {}
`;

try {
	const tokens = lex(code);
	console.log(tokens);

	const program = parse(tokens);

	console.log(
		JSON.stringify(
			program,
			null,
			4
		)
	);
} catch (error) {
	console.log(error);
}