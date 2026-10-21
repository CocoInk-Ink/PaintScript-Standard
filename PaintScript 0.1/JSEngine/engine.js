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
						{	op: "comparator", "args": ["WKey", "UpArrowKey", "SpaceKey"] }
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
		this.threads = new Set([Thread]);
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
}

class Instance {
	constructor(id, instanceOf) {
		super(id);
		this.instanceOf = instanceOf;
		this.target = new instanceOf();
	}

	static createInstance(id, instanceOf) {
		return new this(id, instanceOf);
	};

	static createHiddenInstance(id) {
		return new this(id, new Base(id));
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
	constructor() {}
	static get threads() {
		const t = [];
		
		Object.values(targets).forEach(instance => {
			instance.threads.forEach(i => t.push(i));
		});

		return t;
	}
}

const threads = new Set([Thread]);

const events = [
	{ name: "Start", arg: null },
	{ name: "receive", arg: {parg: "message", type: library.get("System.Message")} },
	{ "name": "KeyDown", arg: { parg: "key", type: library.get("System.Keyboard.KeyboardKey") } }
];

let targets = {};
const instances = new Set([Instance]);

export function startEvent() {
	// If a comparator is the first line in a handler, compare with event args.
	// if the args match, run the event. If no comparator exists, start the event without checking.
}

export function f(_json) {
	json = _json;
	targets = json.targets
}

export function setup() {
	targets = json.targets;
	targets.forEach(t => {
		const inst = new Instance(Date.now().toString(), BaseTarget);

		instances.add(inst);
	})
}

export function getCurrentState() {}
export function Tick() {}