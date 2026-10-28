// parser.js

import {
    Program,
    Variable,
    FunctionDef,
    EventHandler,
    Broadcast,
    CallEvent,
    CallFunction,
    MemberCall,
    Literal,
    Var,
    If,
    Repeat,
    RawStatement,
    RawExpr,
    VarAssign,
    BinaryOp,
    UnaryOp
} from "./ast_nodes.js";

export class Parser {
    constructor(tokens, version, sprite, instance) {
        this.tokens = tokens;
        this.i = 0;
        this.version = version;
        this.sprite = sprite;     // display name
        this.instance = instance; // safe name
    }

    static fromTokens(tokens, version, sprite, instance) {
        return new Parser(tokens, version, sprite, instance);
    }

    // -------------------------
    // Token helpers
    // -------------------------
    peek() {
        return this.tokens[this.i] || null;
    }

    advance() {
        const tok = this.peek();
        this.i++;
        return tok;
    }

    match(...types) {
        const tok = this.peek();
        if (tok && types.includes(tok.type)) {
            this.advance();
            return tok;
        }
        return null;
    }

    match_value(...values) {
        const tok = this.peek();
        if (tok && values.includes(tok.value)) {
            this.advance();
            return tok;
        }
        return null;
    }

    expect(type) {
        const tok = this.peek();
        if (!tok || tok.type !== type) {
            throw new Error(`Expected ${type}, got ${tok ? tok.type : "EOF"}`);
        }
        return this.advance();
    }

    // -------------------------
    // Entry point
    // -------------------------
    parse_program() {
        const globals_ = [];
        const vars_ = [];
        const functions = [];
        const events = [];

        while (this.peek()) {
            const tok = this.peek();

            // variable declarations
            if (["global", "public", "private", "var", "const"].includes(tok.value)) {
                const kind = tok.value;
                const varNode = this.parse_var_decl(kind);
                if (kind === "global") globals_.push(varNode);
                else vars_.push(varNode);
                continue;
            }

            // events
            if (tok.type === "AT_EVENT") {
                events.push(this.parse_event_handler());
                continue;
            }

            // functions
            if (tok.value === "function" || tok.value === "strict") {
                functions.push(this.parse_function());
                continue;
            }

            // fallback
            this.advance();
        }

        return new Program(
            this.version,
            this.sprite,
            this.instance,
            globals_,
            vars_,
            functions,
            events
        );
    }

    // -------------------------
    // Variable declaration
    // -------------------------
    parse_var_decl(kind) {
        if (["global", "public", "private", "var", "const"].includes(kind)) {
            this.advance(); // global/public/private/var/const
        }

        if (this.peek() && this.peek().value === "var") {
            this.advance();
        }

        const nameTok = this.expect("IDENT");
        const name = nameTok.value;

        let type_ = "*";
        if (this.match("COLON")) {
            const typeTok = this.peek();
            if (typeTok && typeTok.type === "IDENT") {
                type_ = this.expect("IDENT").value;
            } else if (typeTok && typeTok.type === "OP" && typeTok.value === "*") {
                type_ = this.advance().value;
            }
        }

        while (this.peek() && this.peek().type !== "SEMICOLON") {
            this.advance();
        }
        this.match("SEMICOLON");

        if (kind === "global") {
            return new Variable(name, type_, "global", true, false);
        } else if (kind === "public") {
            return new Variable(name, type_, "sprite", true, false);
        } else {
            return new Variable(name, type_, "sprite", false, true);
        }
    }

    // -------------------------
    // Event handler
    // -------------------------
    parse_event_handler() {
        const at = this.advance(); // AT_EVENT
        const name = at.value.slice(1); // remove '@'

        let messages = null;
        let params = [];

        if (name.toLowerCase() === "receive") {
            // @receive Message1, Message2
            if (this.peek() && this.peek().type === "IDENT") {
                messages = [];
                while (this.peek() && this.peek().type === "IDENT") {
                    messages.push(this.advance().value);
                    this.match("COMMA");
                }
            }
        } else {
            // params: (key) or identifiers
            if (this.match("LPAREN")) {
                params = this.parse_param_list();
                this.expect("RPAREN");
            } else {
                while (this.peek() && this.peek().type === "IDENT") {
                    params.push(this.advance().value);
                    this.match("COMMA");
                }
            }
        }

        this.expect("LBRACE");
        const code = this.parse_block();
        this.expect("RBRACE");

        return new EventHandler(name, messages, params, code);
    }

    parse_param_list() {
        const params = [];
        while (this.peek() && this.peek().type !== "RPAREN") {
            const tok = this.peek();

            if (tok.type === "IDENT") {
                params.push(this.advance().value);
                if (this.match("COLON")) {
                    const typeTok = this.peek();
                    if (typeTok && typeTok.type === "IDENT") {
                        this.advance();
                    } else if (typeTok && typeTok.type === "OP" && typeTok.value === "*") {
                        this.advance();
                    }
                }
            } else if (tok.type === "OP" && tok.value === "*") {
                this.advance();
            } else {
                this.advance();
            }

            this.match("COMMA");
        }
        return params;
    }

    // -------------------------
    // Function
    // -------------------------
    parse_function() {
        let strict = false;
        if (this.peek().value === "strict") {
            strict = true;
            this.advance();
        }

        this.expect("IDENT"); // "function"
        const name = this.expect("IDENT").value;

        this.expect("LPAREN");
        const params = this.parse_param_list();
        this.expect("RPAREN");

        let return_type = "*";
        if (this.match("COLON")) {
            const typeTok = this.peek();
            if (typeTok && typeTok.type === "IDENT") {
                return_type = this.expect("IDENT").value;
            } else if (typeTok && typeTok.type === "OP" && typeTok.value === "*") {
                return_type = this.advance().value;
            }
        }

        this.expect("LBRACE");
        const code = this.parse_block();
        this.expect("RBRACE");

        return new FunctionDef(name, strict, params, return_type, true, false, code);
    }

    // -------------------------
    // Block
    // -------------------------
    parse_block() {
        const stmts = [];
        while (this.peek() && this.peek().type !== "RBRACE") {
            const stmt = this.parse_statement();
            if (stmt) stmts.push(stmt);
            this.match("SEMICOLON");
        }
        return stmts;
    }

    // -------------------------
    // Statement
    // -------------------------
    parse_statement() {
        const tok = this.peek();
        if (!tok) return null;

        if (tok.value === "Broadcast") return this.parse_broadcast(false);
        if (tok.value === "BroadcastAndWait") return this.parse_broadcast(true);
        if (tok.value === "call") return this.parse_call();
        if (tok.value === "if") return this.parse_if();
        if (tok.value === "repeat") return this.parse_repeat();
        if (tok.value === "forever") return this.parse_forever();
        if (tok.value === "while") return this.parse_while();
        if (tok.value === "wait") return this.parse_wait();
        if (tok.value === "return") return this.parse_return();

        if (tok.type === "IDENT") {
            const next = this.tokens[this.i + 1] || null;
            if (next && next.type === "OP" && ["=", "+=", "-=", "*=", "/=", "++", "--"].includes(next.value)) {
                return this.parse_raw_expression_statement();
            }
            if (next && next.type === "LPAREN") {
                return this.parse_function_call();
            }
            return this.parse_raw_expression_statement();
        }

        this.advance();
        return null;
    }

    parse_broadcast(wait) {
        this.advance();
        const msgTok = this.expect("IDENT");
        return new Broadcast(msgTok.value, wait);
    }

    parse_if() {
        this.advance();

        if (this.peek() && this.peek().value === "not") {
            this.advance();
        }

        this.expect("LPAREN");
        const condition = this.parse_raw_condition();
        this.expect("RPAREN");

        let thenBlock;
        if (this.match("LBRACE")) {
            thenBlock = this.parse_block();
            this.expect("RBRACE");
        } else {
            thenBlock = [this.parse_statement()];
        }

        let elseBlock = null;
        if (this.peek() && this.peek().value === "else") {
            this.advance();
            if (this.match("LBRACE")) {
                elseBlock = this.parse_block();
                this.expect("RBRACE");
            } else if (this.peek() && this.peek().value === "if") {
                elseBlock = [this.parse_if()];
            } else {
                elseBlock = [this.parse_statement()];
            }
        }

        return new If(condition, thenBlock, elseBlock);
    }

    parse_raw_condition() {
        const start = this.i;
        let depth = 0;
        let sawContent = false;

        while (this.peek()) {
            const tok = this.peek();
            if (tok.type === "RPAREN" && depth === 0) {
                break;
            }

            if (tok.type === "LPAREN") depth++;
            if (tok.type === "RPAREN") depth--;

            if (tok.type === "LBRACKET") depth++;
            if (tok.type === "RBRACKET") depth--;

            if (tok.type === "COMMA" && depth === 0) {
                break;
            }

            this.advance();
            sawContent = true;
        }

        const text = this.tokens.slice(start, this.i).map(t => t.value).join("");
        return sawContent ? new RawExpr(text) : new RawExpr("");
    }

    parse_repeat() {
        this.advance();
        let mode = "times";
        let condition = null;

        if (this.match_value("until")) {
            mode = "until";
            this.expect("LPAREN");
            condition = this.parse_raw_condition();
            this.expect("RPAREN");
        } else if (this.match_value("while")) {
            mode = "while";
            this.expect("LPAREN");
            condition = this.parse_raw_condition();
            this.expect("RPAREN");
        } else if (this.match("LPAREN")) {
            condition = this.parse_raw_condition();
            this.expect("RPAREN");
        }

        this.expect("LBRACE");
        const body = this.parse_block();
        this.expect("RBRACE");

        return new Repeat(condition, body, mode);
    }

    parse_forever() {
        this.advance();
        this.expect("LBRACE");
        const body = this.parse_block();
        this.expect("RBRACE");
        return new Repeat(null, body, "forever");
    }

    parse_while() {
        this.advance();
        this.expect("LPAREN");
        const condition = this.parse_raw_condition();
        this.expect("RPAREN");
        this.expect("LBRACE");
        const body = this.parse_block();
        this.expect("RBRACE");
        return new Repeat(condition, body, "while");
    }

    parse_wait() {
        this.advance();
        if (this.peek() && this.peek().value === "until") {
            this.advance();
            this.expect("LPAREN");
            const condition = this.parse_raw_condition();
            this.expect("RPAREN");
            return new RawStatement({ op: "waitUntil", condition });
        }

        if (this.match("LPAREN")) {
            const value = this.parse_raw_condition();
            this.expect("RPAREN");
            return new RawStatement({ op: "wait", value });
        }

        return new RawStatement({ op: "wait" });
    }

    parse_return() {
        this.advance();
        let value = null;
        if (this.peek() && this.peek().type !== "SEMICOLON" && this.peek().type !== "RBRACE") {
            value = this.parse_raw_condition();
        }
        return new RawStatement({ op: "return", value });
    }

    parse_call() {
        this.advance(); // call

        if (this.peek() && this.peek().type === "AT_EVENT") {
            const at = this.advance();
            const name = at.value.slice(1);
            return new CallEvent(name);
        }

        const name = this.expect("IDENT").value;

        let args = [];
        if (this.match("LPAREN")) {
            args = this.parse_arguments();
            this.expect("RPAREN");
        }

        return new CallFunction(name, args);
    }

    parse_member_call() {
        const target = this.advance();
        if (target.value === "this") {
            this.expect("DOT");
            const member_name = this.expect("IDENT").value;

            if (this.peek() && this.peek().type === "LPAREN") {
                this.advance();
                const args = this.parse_arguments();
                this.expect("RPAREN");
                return new MemberCall(this.instance, member_name, args);
            }

            return new MemberCall(this.instance, member_name, []);
        }

        if (target.type === "IDENT" && this.peek() && this.peek().type === "LBRACKET") {
            this.advance();
            const key = this.parse_expression();
            this.expect("RBRACKET");
            return new BinaryOp("[]", new Var(target.value), key);
        }

        // fallback: treat as identifier call or assignment expression
        return new Var(target.value);
    }

    parse_function_call() {
        const name = this.advance().value;

        if (name === "say") {
            let args = [];
            if (this.match("LPAREN")) {
                args = this.parse_arguments();
                this.expect("RPAREN");
            }
            return new MemberCall(this.instance, "say", args);
        }

        let args = [];
        if (this.match("LPAREN")) {
            args = this.parse_arguments();
            this.expect("RPAREN");
        }
        return new CallFunction(name, args);
    }

    // -------------------------
    // Expressions / arguments
    // -------------------------
    parse_arguments() {
        const args = [];
        while (this.peek() && this.peek().type !== "RPAREN") {
            args.push(this.parse_expression());
            this.match("COMMA");
        }
        return args;
    }

    parse_raw_expression_statement() {
        const start = this.i;
        const expr = this.parse_expression();
        const next = this.peek();
        if (next && next.type === "SEMICOLON") {
            this.advance();
        }
        return new RawStatement({
            start,
            expr,
            text: this.tokens.slice(start, this.i).map(t => t.value).join("")
        });
    }

    parse_expression() {
        try {
            return this.parse_assignment();
        } catch (error) {
            const start = this.i;
            let depthParen = 0;
            let depthBracket = 0;
            let depthBrace = 0;

            while (this.peek()) {
                const tok = this.peek();
                if (tok.type === "COMMA" && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
                    break;
                }
                if (tok.type === "SEMICOLON" && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
                    break;
                }
                if (tok.type === "RPAREN" && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
                    break;
                }
                if (tok.type === "RBRACE" && depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
                    break;
                }

                if (tok.type === "LPAREN") depthParen++;
                else if (tok.type === "RPAREN") depthParen = Math.max(0, depthParen - 1);
                else if (tok.type === "LBRACKET") depthBracket++;
                else if (tok.type === "RBRACKET") depthBracket = Math.max(0, depthBracket - 1);
                else if (tok.type === "LBRACE") depthBrace++;
                else if (tok.type === "RBRACE") depthBrace = Math.max(0, depthBrace - 1);

                this.advance();
            }

            const raw = this.tokens.slice(start, this.i).map(t => t.value).join("").trim();
            if (!raw) throw error;
            return new RawExpr(raw);
        }
    }

    parse_assignment() {
        let expr = this.parse_logical_or();
        if (this.peek() && this.peek().type === "OP" && ["=", "+=", "-=", "*=", "/="].includes(this.peek().value)) {
            const op = this.advance().value;
            const right = this.parse_assignment();
            return new VarAssign(expr, new BinaryOp(op, expr, right));
        }
        return expr;
    }

    parse_logical_or() {
        let expr = this.parse_logical_and();
        while (this.peek() && this.peek().type === "OP" && this.peek().value === "||") {
            const op = this.advance().value;
            expr = new BinaryOp(op, expr, this.parse_logical_and());
        }
        return expr;
    }

    parse_logical_and() {
        let expr = this.parse_equality();
        while (this.peek() && this.peek().type === "OP" && this.peek().value === "&&") {
            const op = this.advance().value;
            expr = new BinaryOp(op, expr, this.parse_equality());
        }
        return expr;
    }

    parse_equality() {
        let expr = this.parse_relational();
        while (this.peek() && this.peek().type === "OP" && ["==", "!="].includes(this.peek().value)) {
            const op = this.advance().value;
            expr = new BinaryOp(op, expr, this.parse_relational());
        }
        return expr;
    }

    parse_relational() {
        let expr = this.parse_additive();
        while (this.peek() && this.peek().type === "OP" && ["<", ">", "<=", ">="].includes(this.peek().value)) {
            const op = this.advance().value;
            expr = new BinaryOp(op, expr, this.parse_additive());
        }
        return expr;
    }

    parse_additive() {
        let expr = this.parse_multiplicative();
        while (this.peek() && this.peek().type === "OP" && ["+", "-"].includes(this.peek().value)) {
            const op = this.advance().value;
            expr = new BinaryOp(op, expr, this.parse_multiplicative());
        }
        return expr;
    }

    parse_multiplicative() {
        let expr = this.parse_unary();
        while (this.peek() && this.peek().type === "OP" && ["*", "/"].includes(this.peek().value)) {
            const op = this.advance().value;
            expr = new BinaryOp(op, expr, this.parse_unary());
        }
        return expr;
    }

    parse_unary() {
        if (this.peek() && this.peek().type === "OP" && ["!", "-", "+"].includes(this.peek().value)) {
            const op = this.advance().value;
            return new UnaryOp(op, this.parse_unary());
        }
        return this.parse_postfix();
    }

    parse_postfix() {
        let expr = this.parse_primary();
        while (this.peek() && this.peek().type === "OP" && ["++", "--"].includes(this.peek().value)) {
            const op = this.advance().value;
            expr = new UnaryOp(op, expr);
        }
        return expr;
    }

    parse_primary() {
        const tok = this.peek();
        if (!tok) {
            throw new Error("Unexpected end of expression.");
        }

        if (tok.type === "STRING") {
            this.advance();
            return new Literal("String", tok.value.replace(/^"|"$/g, ""));
        }

        if (tok.type === "NUMBER") {
            this.advance();
            return new Literal("Number", parseFloat(tok.value));
        }

        if (tok.type === "IDENT") {
            const name = this.advance().value;

            if (this.peek() && this.peek().type === "LPAREN") {
                this.advance();
                const args = [];
                while (this.peek() && this.peek().type !== "RPAREN") {
                    args.push(this.parse_expression());
                    this.match("COMMA");
                }
                this.expect("RPAREN");
                return new CallFunction(name, args);
            }

            if (this.peek() && this.peek().type === "DOT") {
                this.advance();
                const member = this.expect("IDENT").value;
                let args = [];
                if (this.peek() && this.peek().type === "LPAREN") {
                    this.advance();
                    while (this.peek() && this.peek().type !== "RPAREN") {
                        args.push(this.parse_expression());
                        this.match("COMMA");
                    }
                    this.expect("RPAREN");
                }
                return new MemberCall(name, member, args);
            }

            if (this.peek() && this.peek().type === "LBRACKET") {
                this.advance();
                const key = this.parse_expression();
                this.expect("RBRACKET");
                return new BinaryOp("[]", new Var(name), key);
            }

            if (this.peek() && this.peek().type === "OP" && ["=", "+=", "-=", "*=", "/="].includes(this.peek().value)) {
                const op = this.advance().value;
                const value = this.parse_expression();
                return new VarAssign(new Var(name), new BinaryOp(op, new Var(name), value));
            }

            return new Var(name);
        }

        if (tok.type === "LPAREN") {
            this.advance();
            const expr = this.parse_expression();
            this.expect("RPAREN");
            return expr;
        }

        if (tok.type === "LBRACKET") {
            this.advance();
            const key = this.parse_expression();
            this.expect("RBRACKET");
            return new BinaryOp("[]", new Var("dict"), key);
        }

        throw new Error(`Unsupported token in expression: ${tok.type} ${tok.value}`);
    }
}

export function parseProgram(tokens, version, sprite, instance) {
    return new Parser(tokens, version, sprite, instance).parse_program();
}
