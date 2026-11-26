import { lex } from "./lexer";
import { parse } from "./parser";

const code = `
#PaintScript 0.1
#Sprite Sprite_1

@Start {
    say("Hello, World!"); // Same as this.say or Sprite_1.say
	var hello = "Hello!";

	say(hello);
	var var1 = 3;
	var var2 = 7;

	var sum = add(var1, var2);
	say(sum);

	call @refresh;
}

public strict function add(num1, num2) {
	return num1 + num2;
}
`;

try {
	console.log(parse(lex(code)));
} catch (error) {
	console.log(error);
}