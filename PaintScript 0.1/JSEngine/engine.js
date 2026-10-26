// engine.js
// The runtime for the PaintScript programming language.

// The runtime is a bridge in between JS and C#.
// The GUI is written in C#, so we need to make sure that this code is not
// too independent, but can still run standalone for tests.

/*
	In PaintScript, each event handler gets it's own thread.
*/

import { library } from "./Library.js"

let json = {
	"version": "0.1",

	"permissions": {
		"filesystem": false,

		"networking": false
	},

	"globals": {
		"variables": {},

		"functions": {}
	},

	"targets": [
		{
			"name": "Sprite 1",

			"instance": "Sprite_1",

			"variables": {},

			"functions": {},

			"events": {
				"Start": [
					[
						{
							"op": "call",

							"fields": {
								"name": {
									"kind": "member",

									"args": [
										{
											"kind": "literal",

											"type": "String",

											"value": "Sprite_1"
										},

										{
											"kind": "literal",

											"type": "String",

											"value": "say"
										}
									]
								},

								"args": [
									{
										"kind": "literal",

										"type": "String",

										"value": "Hello, World!"
									}
								]
							}
						},

						{
							"op": "event_call",

							"fields": {
								"name": "refresh",

								"args": []
							}
						}
					]
				],
				"Keydown": [
					[
						{ op: "comparator", "args": ["WKey", "UpArrowKey", "SpaceKey"] }
					]
				]
			}
		}
	]
}

class BaseTarget {
	constructor(id) {
		this.id = id;
		this.properties = {}
		this.threads = new Set();
	}

	setProperties(properties) {
		this.properties = { ...properties };
	}
}

class Sprite extends BaseTarget {
	constructor(id) {
		super(id);
		this.setProperties({
			...library.get("System.Sprites.BaseSpriteProperties"),
			visible: true
		});
	}

	say(message) {
		NewLogs.push(String(message));
	}
}

class Instance {
	constructor(id, instanceOf) {
		this.id = id;
		this.instanceOf = instanceOf;
		this.target = new instanceOf(id);
		this.threads = this.target.threads;
	}

	static createInstance(id, instanceOf) {
		return new this(id, instanceOf);
	};

	static createHiddenInstance(id) {
		return new this(id, BaseTarget);
	}
}

class Dictionary {
	constructor(dict) {
		this.dict = dict || {};
	}

	Add(key, value) {
		this.dict[key] = value;
	}

	Get(key) {
		return this.dict[key];
	}
}

class Thread {
	constructor(target, code) {
		this.target = target;
		this.frames = [{ code, instruction: 0, locals: {}, target }];
	}

	step() {
		const frame = this.frames[this.frames.length - 1];
		if (!frame) {
			this.target.threads.delete(this);
			return;
		}

		if (frame.instruction >= frame.code.length) {
			if (frame.loop?.mode == "times") frame.loop.remaining--;
			if (!frame.loop || !this.shouldRepeat(frame)) {
				this.frames.pop();
			} else {
				frame.instruction = 0;
			}
			if (this.frames.length == 0) this.target.threads.delete(this);
			return;
		}

		this.execute(frame.code[frame.instruction++], frame);
	}

	shouldRepeat(frame) {
		const { mode, condition } = frame.loop;
		if (mode == "forever") return true;
		if (mode == "times") return frame.loop.remaining > 0;
		const value = Boolean(evaluate(condition, frame.target, frame.locals));
		if (mode == "while") return value;
		if (mode == "until" || mode == "repeat_until") return !value;
		throw new Error(`Unsupported repeat mode '${mode}'.`);
	}

	execute(statement, frame) {
		if (statement.expr) {
			this.executeExpressionStatement(statement.expr, frame);
			return;
		}

		switch (statement.op) {
			case "assign":
				assign(statement.fields.name, evaluate(statement.fields.value, frame.target, frame.locals), frame.target, frame.locals);
				break;
			case "var":
				frame.locals[statement.fields.name] = evaluate(statement.fields.value, frame.target, frame.locals);
				break;
			case "call":
				this.call(statement.fields.name, statement.fields.args || [], frame);
				break;
			case "event_call":
				startEvent(statement.fields.name);
				break;
			case "if":
				this.pushCode(
					evaluate(statement.fields.condition, frame.target, frame.locals)
						? statement.fields.then || []
						: statement.fields.else || [],
					frame.locals,
					null,
					frame.target
				);
				break;
			case "repeat": {
				const fields = statement.fields;
				const mode = fields.mode || "times";
				const condition = fields.condition;
				const body = fields.body || fields.code || [];
				const loop = {
					mode,
					condition,
					remaining: Math.max(0, Math.floor(Number(evaluate(condition, frame.target, frame.locals)) || 0))
				};
				if (mode == "times" && loop.remaining == 0) break;
				if ((mode == "while" && !evaluate(condition, frame.target, frame.locals))
					|| ((mode == "until" || mode == "repeat_until") && evaluate(condition, frame.target, frame.locals))) break;
				this.pushCode(body, frame.locals, loop, frame.target);
				break;
			}
			case "broadcast":
			case "broadcast_wait":
			case "broadcastAndWait":
				startEvent(statement.fields.message);
				break;
			default:
				throw new Error(`Unsupported PaintScript instruction '${statement.op || "unknown"}'.`);
		}
	}

	executeExpressionStatement(expression, frame) {
		if (expression.target && Object.hasOwn(expression, "value")) {
			assign(expression.target, evaluate(expression.value.right, frame.target, frame.locals), frame.target, frame.locals);
			return;
		}
		if (expression.target && expression.method) {
			this.call({ target: expression.target, method: expression.method }, expression.args || [], frame);
			return;
		}
		throw new Error("Unsupported PaintScript expression statement.");
	}

	call(name, args, frame) {
		if (typeof name == "string") {
			if (name.toLowerCase() == "refresh") {
				startEvent("refresh");
				return;
			}
			const fn = frame.target.functions?.[name];
			if (!fn) throw new Error(`Function '${name}' was not found on target '${frame.target.instance}'.`);
			this.pushFunction(frame.target, fn, args, frame);
			return;
		}
		if (name.kind == "member") {
			const [targetName, methodName] = name.args.map(argument => argument.value);
			this.callMember(targetName, methodName, args, frame);
			return;
		}
		if (name.target && name.method) {
			this.callMember(name.target, name.method, args, frame);
			return;
		}
		throw new Error("Unsupported PaintScript call target.");
	}

	callMember(targetName, methodName, args, frame) {
		const target = targets.find(item => item.instance == targetName || item.name == targetName);
		if (!target) throw new Error(`Target '${targetName}' was not found.`);
		const fn = target.functions?.[methodName];
		if (fn) {
			this.pushFunction(target, fn, args, frame);
			return;
		}
		const method = target.target[methodName];
		if (typeof method != "function") throw new Error(`Method '${methodName}' was not found on target '${targetName}'.`);
		method.apply(target.target, args.map(argument => evaluate(argument, frame.target, frame.locals)));
	}

	pushFunction(target, fn, args, frame) {
		const locals = {};
		(fn.parameters || []).forEach((parameter, index) => {
			const parameterName = typeof parameter == "string" ? parameter : parameter.name;
			locals[parameterName] = evaluate(args[index], frame.target, frame.locals);
		});
		this.pushCode(fn.code || [], locals, null, target);
	}

	pushCode(code, locals, loop = null, target = this.target) {
		if (code.length) this.frames.push({ code, instruction: 0, locals, loop, target });
	}

	static get threads() {
		return targets.flatMap(target => [...target.threads]);
	}
}

function evaluate(expression, target, locals) {
	if (expression == null) return null;
	if (typeof expression == "number" || typeof expression == "boolean") return expression;
	if (typeof expression == "string") return evaluateText(expression, target, locals);
	if (Array.isArray(expression)) return expression.map(item => evaluate(item, target, locals));
	if (Object.hasOwn(expression, "value")) return expression.value;
	if (expression.kind == "literal") return expression.value;
	if (expression.kind == "var" || expression.name) return readVariable(expression.name, target, locals);
	if (expression.op && Object.hasOwn(expression, "left"))
		return applyOperator(expression.op, evaluate(expression.left, target, locals), evaluate(expression.right, target, locals));
	if (expression.kind == "binary")
		return applyOperator(expression.op, evaluate(expression.left, target, locals), evaluate(expression.right, target, locals));
	if (expression.kind == "unary") {
		const value = evaluate(expression.expr, target, locals);
		return expression.op == "!" ? !value : expression.op == "-" ? -Number(value) : value;
	}
	if (expression.target && expression.method) {
		const memberTarget = targets.find(item => item.instance == expression.target || item.name == expression.target);
		if (!memberTarget) throw new Error(`Target '${expression.target}' was not found.`);
		if (expression.method in memberTarget.target.properties) return memberTarget.target.properties[expression.method];
		const variable = memberTarget.variables?.[expression.method];
		if (variable) return variable.value?.value;
	}
	throw new Error(`Unsupported PaintScript expression '${JSON.stringify(expression)}'.`);
}

function readVariable(name, target, locals) {
	if (Object.hasOwn(locals, name)) return locals[name];
	if (name == "true") return true;
	if (name == "false") return false;
	if (name == "empty" || name == "null") return null;
	if (name == "this") return target.target.properties;
	if (Object.hasOwn(target.target.properties, name)) return target.target.properties[name];
	const variable = target.variables?.[name];
	if (variable) return variable.value?.value;
	throw new Error(`Variable '${name}' was not found on target '${target.instance}'.`);
}

function assign(destination, value, target, locals) {
	if (typeof destination == "string") {
		if (Object.hasOwn(locals, destination)) locals[destination] = value;
		else if (Object.hasOwn(target.target.properties, destination)) target.target.properties[destination] = value;
		else if (target.variables?.[destination]) target.variables[destination].value.value = value;
		else locals[destination] = value;
		return;
	}
	if (destination.name) {
		assign(destination.name, value, target, locals);
		return;
	}
	if (destination.target && destination.method) {
		const memberTarget = targets.find(item => item.instance == destination.target || item.name == destination.target);
		if (!memberTarget) throw new Error(`Target '${destination.target}' was not found.`);
		if (Object.hasOwn(memberTarget.target.properties, destination.method))
			memberTarget.target.properties[destination.method] = value;
		else if (memberTarget.variables?.[destination.method])
			memberTarget.variables[destination.method].value.value = value;
		else throw new Error(`Property '${destination.method}' was not found on target '${destination.target}'.`);
		return;
	}
	throw new Error("Unsupported PaintScript assignment target.");
}

function applyOperator(operator, left, right) {
	switch (operator) {
		case "+": return typeof left == "string" || typeof right == "string" ? String(left) + String(right) : Number(left) + Number(right);
		case "-": return Number(left) - Number(right);
		case "*": return Number(left) * Number(right);
		case "/": return Number(right) == 0 ? 0 : Number(left) / Number(right);
		case "%": return Number(right) == 0 ? 0 : Number(left) % Number(right);
		case "==":
		case "===": return left == right;
		case "!=":
		case "!==": return left != right;
		case ">": return left > right;
		case ">=": return left >= right;
		case "<": return left < right;
		case "<=": return left <= right;
		case "&&": return Boolean(left && right);
		case "||": return Boolean(left || right);
		default: throw new Error(`Unsupported PaintScript operator '${operator}'.`);
	}
}

function evaluateText(text, target, locals) {
	const tokens = text.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(?:\d+(?:\.\d*)?|\.\d+)|[A-Za-z_$][\w$]*|===|!==|==|!=|>=|<=|&&|\|\||[()+\-*/%<>!]/g);
	const compactText = text.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\s+/g, (match, quoted) => quoted || "");
	if (!tokens || tokens.join("").toLowerCase() != compactText.toLowerCase())
		throw new Error(`Unsupported PaintScript expression '${text}'.`);

	let index = 0;
	const precedence = { "||": 1, "&&": 2, "==": 3, "===": 3, "!=": 3, "!==": 3, ">": 4, ">=": 4, "<": 4, "<=": 4, "+": 5, "-": 5, "*": 6, "/": 6, "%": 6 };
	const parsePrimary = () => {
		const token = tokens[index++];
		if (token == "(") {
			const value = parseBinary(0);
			if (tokens[index++] != ")") throw new Error(`Unclosed expression '${text}'.`);
			return value;
		}
		if (token == "!" || token == "-") {
			const value = parsePrimary();
			return token == "!" ? !value : -Number(value);
		}
		if (token?.startsWith('"') || token?.startsWith("'")) return token.slice(1, -1);
		if (/^(?:\d|\.)/.test(token || "")) return Number(token);
		return readVariable(token, target, locals);
	};
	const parseBinary = minimum => {
		let left = parsePrimary();
		while (index < tokens.length && (precedence[tokens[index]] || 0) >= minimum) {
			const operator = tokens[index++];
			const right = parseBinary(precedence[operator] + 1);
			left = applyOperator(operator, left, right);
		}
		return left;
	};
	const result = parseBinary(1);
	if (index != tokens.length) throw new Error(`Unexpected token '${tokens[index]}' in '${text}'.`);
	return result;
}

const events = [
	{ name: "Start", arg: null },
	{ name: "receive", arg: { parg: "message", type: library.get("System.Types.Message") } },
	{ "name": "KeyDown", arg: { parg: "key", type: library.get("System.Keyboard.KeyboardKey") } }
];

let targets = [];

const eventsRunning = {};

let RefreshNeeded = true;
let NewLogs = [];
let lastTargetState = "";

export function startEvent(event, arg) {
	if (event == "refresh") {
		RefreshNeeded = true;
		return;
	}

	// Get event handlers
	targets.forEach(target => {
		const handlers = target.events?.[event] ?? [];
		handlers.forEach(handler => {
			const code = Array.isArray(handler) ? [...handler] : [];
			const comparator = code[0];
			if (comparator?.op == "comparator") {
				if (!comparator.args.includes(arg)) return;
				code.shift();
			}
			const thread = new Thread(target, code);
			target.threads.add(thread);
		});
	});
}

export function f(_json) {
	json = typeof _json === "string" ? JSON.parse(_json) : _json;
}

export function setup() {
	targets = json.targets.map((definition, index) => {
		const instance = Instance.createInstance(String(index), Sprite);
		const variables = {};
		for (const [name, value] of Object.entries(definition.variables || {})) {
			variables[name] = {
				...value,
				value: value.value && typeof value.value == "object" ? { ...value.value } : value.value
			};
		}
		return {
			...definition,
			variables,
			id: instance.id,
			target: instance.target,
			threads: instance.threads
		};
	});
}

// Used by C#, this is how it knows whats going on inside the program.
export function getCurrentState() {
	const currentTargets = targets.map(target => {
		const properties = target.target.properties;
		return {
			name: target.name,
			instance: target.instance ?? "",
			position: {
				x: Number.isFinite(Number(properties.x)) ? Number(properties.x) : 0,
				y: Number.isFinite(Number(properties.y)) ? Number(properties.y) : 0
			},
			visible: properties.visible !== false
		};
	});

	const targetState = JSON.stringify(currentTargets);
	if (targetState !== lastTargetState) {
		RefreshNeeded = true;
		lastTargetState = targetState;
	}

	const state = {
		targets: currentTargets,
		RefreshNeeded,
		NewLogs
	};

	RefreshNeeded = false;
	NewLogs = [];

	return state;
}

// Tick each thread
export function Tick() {
	Thread.threads.forEach(thread => thread.step());
}

// Activate the start event
export function Start() {
	startEvent("Start", null);
}

export function LoadAndStart(_json) {
	f(_json);
	setup();
	Start();
}

function Standalone() {
	setup();
	Start();

	var i = 1;

	function myLoop() {
		setTimeout(function () {
			Tick(); // Tick each thread.
			console.log(getCurrentState());
			if (true) {
				myLoop();
			}
		}, 1000)
	}

	myLoop();
}

if (typeof process !== "undefined" && process.release?.name === "node") {
    Standalone();
}
