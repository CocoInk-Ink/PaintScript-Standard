import {
    Program,
    Event,
    FunctionDef,
    Variable,
    Broadcast,
    CallEvent,
    CallFunction,
    MemberCall,
    Call,
    If,
    Repeat,
    VarAssign,
    Literal,
    Var,
    BinaryOp,
    UnaryOp,
    RawExpr,
    RawStatement
} from "./ast_nodes.js";

function serialize_expression(node) {
    if (node instanceof Literal) {
        return {
            kind: "literal",
            type: node.type,
            value: node.value
        };
    }

    if (node instanceof Var) {
        return {
            kind: "var",
            name: node.name
        };
    }

    if (node instanceof MemberCall) {
        return {
            kind: "member",
            target: node.target,
            method: node.method,
            args: node.args.map(serialize_expression)
        };
    }

    if (node instanceof BinaryOp) {
        return {
            kind: "binary",
            op: node.op,
            left: serialize_expression(node.left),
            right: serialize_expression(node.right)
        };
    }

    if (node instanceof UnaryOp) {
        return {
            kind: "unary",
            op: node.op,
            expr: serialize_expression(node.expr)
        };
    }

    if (node instanceof RawExpr) {
        return node.raw;
    }

    throw new Error(`Unsupported expression in IR: ${node?.constructor?.name ?? typeof node}`);
}

function serialize_statement(node) {
    if (node instanceof Broadcast) {
        return {
            op: node.wait ? "broadcastAndWait" : "broadcast",
            fields: { message: node.message }
        };
    }

    if (node instanceof CallEvent) {
        return {
            op: "event_call",
            fields: {
                name: node.name,
                args: []
            }
        };
    }

    if (node instanceof CallFunction || node instanceof Call) {
        return {
            op: "call",
            fields: {
                name: node.name,
                args: node.args.map(serialize_expression)
            }
        };
    }

    if (node instanceof MemberCall) {
        return {
            op: "call",
            fields: {
                name: {
                    kind: "member",
                    args: [
                        {
                            kind: "literal",
                            type: "String",
                            value: node.target
                        },
                        {
                            kind: "literal",
                            type: "String",
                            value: node.method
                        }
                    ]
                },
                args: node.args.map(serialize_expression)
            }
        };
    }

    if (node instanceof VarAssign) {
        return {
            op: "assign",
            fields: {
                name: node.target.name,
                value: serialize_expression(node.value)
            }
        };
    }

    if (node instanceof If) {
        return {
            op: "if",
            fields: {
                condition: serialize_expression(node.condition),
                then: node.then_block.map(serialize_statement),
                else: node.else_block?.map ? node.else_block.map(serialize_statement) : []
            }
        };
    }

    if (node instanceof Repeat) {
        return {
            op: "repeat",
            fields: {
                mode: node.mode,
                condition: node.condition ? serialize_expression(node.condition) : null,
                body: node.body.map(serialize_statement)
            }
        };
    }

    if (node && node.raw) {
        return node.raw;
    }

    throw new Error(`Unsupported statement in IR: ${node?.constructor?.name ?? typeof node}`);
}

function serialize_variable(variable) {
    return {
        name: variable.name,
        type: variable.type,
        value: {
            type: variable.type,
            value: null
        },
        isPublic: variable.isPublic,
        isPrivate: variable.isPrivate
    };
}

function serialize_function(fn) {
    return {
        name: fn.name,
        strict: fn.strict,
        parameters: fn.params,
        returnType: fn.return_type,
        code: fn.body.statements.map(serialize_statement),
        isPublic: fn.isPublic,
        isPrivate: fn.isPrivate
    };
}

export function ast_to_json(program) {
    if (!(program instanceof Program)) {
        throw new Error("Expected a Program AST when generating IR.");
    }

    const globals = {};
    for (const variable of program.globals) {
        globals[variable.name] = serialize_variable(variable);
    }

    const variables = {};
    for (const variable of program.vars) {
        variables[variable.name] = serialize_variable(variable);
    }

    const functions = {};
    for (const fn of program.functions) {
        functions[fn.name] = serialize_function(fn);
    }

    const events = {};
    for (const event of program.events) {
        const eventName = event.name
            ? event.name[0].toUpperCase() + event.name.slice(1).toLowerCase()
            : event.name;
        events[eventName] ??= [];
        events[eventName].push(event.body.map(serialize_statement));
    }

    return {
        version: program.version,
        globals: {
            variables: globals,
            functions: {}
        },
        name: program.sprite,
        instance: program.instance,
        variables,
        functions,
        events
    };
}
