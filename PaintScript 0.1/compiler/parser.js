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
    Var
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
            if (["global", "public", "private"].includes(tok.value)) {
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
        this.advance(); // global/public/private

        this.expect("IDENT"); // "var"
        const nameTok = this.expect("IDENT");
        const name = nameTok.value;

        let type_ = "*";
        if (this.match("COLON")) {
            const typeTok = this.expect("IDENT");
            type_ = typeTok.value;
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
            if (this.peek().type === "IDENT") {
                params.push(this.advance().value);
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
            return_type = this.expect("IDENT").value;
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

        if (tok.type === "IDENT" && tok.value === "this") {
            return this.parse_member_call();
        }

        if (tok.type === "IDENT") {
            return this.parse_function_call();
        }

        this.advance();
        return null;
    }

    parse_broadcast(wait) {
        this.advance();
        const msgTok = this.expect("IDENT");
        return new Broadcast(msgTok.value, wait);
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
        this.advance(); // this
        this.expect("DOT");
        const member_name = this.expect("IDENT").value;

        this.expect("LPAREN");
        const args = this.parse_arguments();
        this.expect("RPAREN");

        return new MemberCall(this.instance, member_name, args);
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

    parse_expression() {
        const tok = this.advance();

        if (tok.type === "STRING") {
            return new Literal("String", tok.value.replace(/^"|"$/g, ""));
        }

        if (tok.type === "NUMBER") {
            return new Literal("Number", parseFloat(tok.value));
        }

        if (tok.type === "IDENT") {
            return new Var(tok.value);
        }

        return new Literal("*", tok.value);
    }
}

export function parseProgram(tokens, version, sprite, instance) {
    return new Parser(tokens, version, sprite, instance).parse_program();
}
