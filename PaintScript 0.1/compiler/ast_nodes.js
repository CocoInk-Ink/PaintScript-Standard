// ast_nodes.js

export class Node {}

export class Program extends Node {
    constructor(version, sprite, instance, globals, vars, functions, events) {
        super();
        this.version = version;
        this.sprite = sprite;
        this.instance = instance;
        this.globals = globals;
        this.publics = [];
        this.vars = vars;
        this.events = events;
        this.functions = functions;
    }
}

export class Variable extends Node {
    constructor(name, type_, scope = "sprite", isPublic = false, isPrivate = false) {
        super();
        this.name = name;
        this.type = type_;
        this.scope = scope;
        this.isPublic = isPublic;
        this.isPrivate = isPrivate;
    }
}

export class Event extends Node {
    constructor(name, params, body) {
        super();
        this.name = name;
        this.params = params;
        this.body = body;
    }
}

export class EventHandler extends Event {
    constructor(name, messages, params, body) {
        super(name, params, body);
        this.messages = messages;
    }
}

export class Broadcast extends Node {
    constructor(message, wait = false) {
        super();
        this.message = message;
        this.wait = wait;
    }
}

export class CallEvent extends Node {
    constructor(name) {
        super();
        this.name = name;
    }
}

export class CallFunction extends Node {
    constructor(name, args = []) {
        super();
        this.name = name;
        this.args = args;
    }
}

export class MemberCall extends Node {
    constructor(target, method, args = []) {
        super();
        this.target = target;
        this.method = method;
        this.args = args;
    }
}

export class FunctionDef extends Node {
    constructor(name, strict, params, return_type, isPublic, isPrivate, body) {
        super();
        this.name = name;
        this.strict = strict;
        this.params = params;
        this.return_type = return_type;
        this.isPublic = isPublic;
        this.isPrivate = isPrivate;
        this.body = body instanceof Block ? body : new Block(body ?? []);
    }
}

export class Block extends Node {
    constructor(statements = []) {
        super();
        this.statements = statements;
    }
}

export class VarAssign extends Node {
    constructor(target, value) {
        super();
        this.target = target;
        this.value = value;
    }
}

export class If extends Node {
    constructor(condition, then_block, else_block = null) {
        super();
        this.condition = condition;
        this.then_block = then_block;
        this.else_block = else_block;
    }
}

export class Repeat extends Node {
    constructor(condition, body, mode) {
        super();
        this.condition = condition;
        this.body = body;
        this.mode = mode; // "times", "until", "while", "forever"
    }
}

export class Call extends Node {
    constructor(name, args) {
        super();
        this.name = name;
        this.args = args;
    }
}

export class BinaryOp extends Node {
    constructor(op, left, right) {
        super();
        this.op = op;
        this.left = left;
        this.right = right;
    }
}

export class UnaryOp extends Node {
    constructor(op, expr) {
        super();
        this.op = op;
        this.expr = expr;
    }
}

export class Var extends Node {
    constructor(name) {
        super();
        this.name = name;
    }
}

export class Literal extends Node {
    constructor(type, value) {
        super();
        this.type = type;
        this.value = value;
    }
}
