// typechecker.js

function can_assign(to_type, from_type) {
    if (to_type === from_type) return true;
    if (to_type === "*" || from_type === "*") return true;
    if (to_type === "Number" && from_type === "String") return true;
    if (to_type === "String" && (from_type === "Number" || from_type === "int")) return true;
    return false;
}

function expr_type(env, expr) {
    // In Python you imported Literal, Var; same idea here.
    if (expr.type === "literal") {
        return expr.valueType || "*";
    }
    if (expr.type === "var") {
        return env.get_var(expr.name);
    }
    return "*";
}

export function check_program(program) {
    // This mirrors your checker logic: build env, add globals, vars, funcs, then walk events. 
    const env = new TypeEnv();

    for (const g of program.globals || []) {
        env.add_var(g.name, g.type);
    }

    for (const v of program.vars || []) {
        env.add_var(v.name, v.type);
    }

    for (const f of program.functions || []) {
        const param_types = Array(f.params.length).fill("*");
        env.add_func(f.name, param_types, f.return_type);
    }

    for (const e of program.events || []) {
        for (const stmt of e.body.statements || []) {
            check_stmt(env, stmt);
        }
    }
}

class TypeEnv {
    constructor() {
        this.vars = new Map();
        this.funcs = new Map();
    }

    add_var(name, type) {
        this.vars.set(name, type);
    }

    add_func(name, param_types, return_type) {
        this.funcs.set(name, { params: param_types, ret: return_type });
    }

    get_var(name) {
        return this.vars.get(name) ?? "*";
    }

    get_func(name) {
        return this.funcs.get(name) ?? { params: [], ret: "*" };
    }
}

function check_stmt(env, stmt) {
    if (stmt.type === "assign") {
        const expected = env.get_var(stmt.target);
        const actual = expr_type(env, stmt.value);
        if (!can_assign(expected, actual)) {
            console.log(`[TypeError] Assign ${stmt.target} expected ${expected}, got ${actual}.`);
        }
        return;
    }

    if (stmt.type === "call") {
        const fn = env.get_func(stmt.name);
        if (stmt.args.length !== fn.params.length) {
            console.log(`[TypeWarning] Function '${stmt.name}' called with wrong number of args.`);
        }
        stmt.args.forEach((arg, i) => {
            const arg_t = expr_type(env, arg);
            const expected = fn.params[i] ?? "*";
            if (!can_assign(expected, arg_t)) {
                console.log(`[TypeError] Arg ${i} to '${stmt.name}' expected ${expected}, got ${arg_t}.`);
            }
        });
        return;
    }

    // Other statements (if, repeat, etc.) can be added similarly.
}
