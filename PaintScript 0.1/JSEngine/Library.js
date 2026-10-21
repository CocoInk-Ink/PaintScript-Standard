const LIBRArY = {
	get: function(address) {
		return eval(`this.${address}`);
	},
	"System": {
		"Types": {
			"Boolean": Boolean,
			"Message": Message,
			"Any": Type,
			"String": String,
			"ParamTypes": {
				"MessageEventParam": MessageEventParam
			}
		},
		"Keyboard": {
			"Keyboard": null,
			"KeyboardKey": KeyboardKey
		},
		"Sprites": {
			"BaseSpriteProperties": {}
		}
	}
}

const Keys = ["A", "B", "C", "D"];

class InvalidCoercionError extends Error {
	constructor(message) {
		super("Failed! Invalid coercion!: " + message);
	}
}

class Type {
	constructor(name, value) {
		this.value = value;
	}

	static coercion(value) {
		return value;
	}
}

class EventParam extends Type {
	constructor(value, name, type) {
		if (name == null || name == undefined) throw new Error("Name is null!");
		super (value);
		this.name = name;
		this.type = type;
	}
	static coercion(value) {
		throw new InvalidCoercionError("EventParam cannot be coerced!");
	}
}

class MessageEventParam extends EventParam {
	constructor(name) {
		super(name, "Message", Message);
	}
}

class KeyboardEventParam extends EventParam {
	constructor(name) {
		super(name, "KeyboardKey", KeyboardKey);
	}
}

class Message extends Type {
	constructor(name) {
		super(String.coercion(name));
	}
	static coercion(value) {
		return String.coercion(value);
	}
}

class KeyboardKey extends Type {
	constructor(key) {
		super(key);
	}
}

class String extends Type {
	constructor(value) {
		if (typeof value != "string") throw new InvalidCoercionError(`${value} is not a string.`);
		super(value);
	}
	static coercion(value) {
		return value + "";
	}
}

class Boolean extends Type {
	constructor(value) {
		super(Boolean.coercion(value));
	}

	static coercion(value) {
		// Already a boolean
		if (value == true) return true;
		if (value == false) return false;

		// Coercion
		if (value == null) return false;
		if (value == 1) return true;
		if (value == 0) return false;
		if (value == NaN || value == undefined) return false
		if (value != null || value != NaN || value != undefined) return true;
		throw new InvalidCoercionError(`${value} is not a boolean and cannot be coerced.`);
	}
}

module.exports = { library: LIBRArY };