class InvalidCoercionError extends TypeError {
	constructor(message) {
		super(`Failed! Invalid coercion!: ${message}`);
		this.name = "InvalidCoercionError";
	}
}

class Type {
	constructor(value) {
		this.value = value;
	}

	static coercion(value) {
		return value;
	}
}

class EventParam extends Type {
	constructor(value, name, type) {
		if (name == null) throw new TypeError("Event parameter name cannot be null.");
		super(value);
		this.name = name;
		this.type = type;
	}

	static coercion() {
		throw new InvalidCoercionError("EventParam cannot be coerced.");
	}
}

class Message extends Type {
	constructor(value) {
		super(globalThis.String(value));
	}

	static coercion(value) {
		return globalThis.String(value);
	}
}

class KeyboardKey extends Type {
	constructor(key) {
		super(key);
		this.name = key;
	}
}

class StringType extends Type {
	constructor(value) {
		if (typeof value !== "string") {
			throw new InvalidCoercionError(`${value} is not a string.`);
		}
		super(value);
	}

	static coercion(value) {
		return globalThis.String(value);
	}
}

class BooleanType extends Type {
	constructor(value) {
		super(BooleanType.coercion(value));
	}

	static coercion(value) {
		return globalThis.Boolean(value);
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

const library = {
	System: {
		Types: {
			Boolean: BooleanType,
			Message,
			Any: Type,
			String: StringType,
			ParamTypes: {
				MessageEventParam,
				KeyboardEventParam
			}
		},
		Keyboard: {
			Keyboard: null,
			KeyboardKey
		},
		Sprites: {
			BaseSpriteProperties: {
				x: 0,
				y: 0,
				say: function (...args) {
					console.log(...args);
				}
			}
		}
	},

	get(address) {
		if (typeof address !== "string" || address.length === 0) {
			throw new TypeError("Library address must be a non-empty string.");
		}

		let value = this;
		for (const part of address.split(".")) {
			if (value == null || !Object.hasOwn(value, part)) {
				throw new Error(`Library address not found: ${address}`);
			}
			value = value[part];
		}
		return value;
	}
};

export { library };