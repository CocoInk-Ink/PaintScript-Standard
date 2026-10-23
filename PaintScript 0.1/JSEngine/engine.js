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
		this.properties = properties;
	}
}

class Sprite extends BaseTarget {
	constructor(id) {
		super(id);
		this.setProperties(library.get("System.Sprites.BaseSpriteProperties"));
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
		this.code = code;
		this.instruction = 0;
	}

	step() {
		const statement = this.code[this.instruction++];
		if (!statement) {
			this.target.threads.delete(this);
			return;
		}

		if (statement.op == "call") {
			const { name, args = [] } = statement.fields;
			if (name.kind == "member") {
				const [targetName, methodName] = name.args.map(argument => argument.value);
				const target = targets.find(item => item.instance == targetName);
				if (!target) throw new Error(`Target '${targetName}' was not found.`);
				const method = target.target[methodName];
				if (typeof method != "function") {
					throw new Error(`Method '${methodName}' was not found on target '${targetName}'.`);
				}
				method.apply(target.target, args.map(argument => argument.value));
			}
		} else if (statement.op == "event_call") {
			startEvent(statement.fields.name);
		}

		if (this.instruction >= this.code.length) {
			this.target.threads.delete(this);
		}
	}

	static get threads() {
		return targets.flatMap(target => [...target.threads]);
	}
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
	json = _json;
}

export function setup() {
	targets = json.targets.map((definition, index) => {
		const instance = Instance.createInstance(String(index), Sprite);
		return {
			...definition,
			id: instance.id,
			target: instance.target,
			threads: instance.threads
		};
	});
}

// Used by C#, this is how it knows whats going on inside the program.
export function getCurrentState() {
	const t = [];
	targets.forEach(ta => {
		t.push(ta.name);
	});

	const state = {
		targets: t,
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
