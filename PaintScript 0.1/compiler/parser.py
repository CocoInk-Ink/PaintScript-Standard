# parser.py

# =========================
# AST NODES
# =========================

class Node:
    pass


class Program(Node):
    def __init__(self, version, sprite, globals_, vars_, functions, events):
        self.version = version
        self.sprite = sprite
        self.globals = globals_
        self.vars = vars_
        self.functions = functions
        self.events = events

    def to_dict(self):
        return {
            "version": self.version,
            "globals": {
                "variables": {
                    g.name: g.to_dict()
                    for g in self.globals
                },
                "functions": {}  # functions at global scope (not used yet)
            },
            "targets": [
                {
                    "name": self.sprite,
                    "instance": self.sprite,
                    "variables": {
                        v.name: v.to_dict()
                        for v in self.vars
                    },
                    "functions": {
                        f.name: f.to_dict()
                        for f in self.functions
                    },
                    "events": self._events_to_dict()
                }
            ]
        }

    def _events_to_dict(self):
        events_map = {}
        for e in self.events:
            key = f"@{e.name.lower()}"
            if key not in events_map:
                events_map[key] = []
            events_map[key].append(e.to_dict())
        return events_map


class Variable(Node):
    def __init__(self, name, type_, scope, is_public, is_private):
        self.name = name
        self.type = type_
        self.scope = scope  # "global" or "sprite"
        self.isPublic = is_public
        self.isPrivate = is_private

    def to_dict(self):
        return {
            "name": self.name,
            "type": self.type,
            "value": {
                "type": self.type,
                "value": None
            },
            "isPublic": self.isPublic,
            "isPrivate": self.isPrivate
        }


class Function(Node):
    def __init__(self, name, strict, parameters, return_type, is_public, is_private, code):
        self.name = name
        self.strict = strict
        self.parameters = parameters
        self.return_type = return_type
        self.isPublic = is_public
        self.isPrivate = is_private
        self.code = code

    def to_dict(self):
        return {
            "name": self.name,
            "strict": self.strict,
            "parameters": self.parameters,
            "returnType": self.return_type,
            "code": [stmt.to_dict() for stmt in self.code],
            "isPublic": self.isPublic,
            "isPrivate": self.isPrivate
        }


class EventHandler(Node):
    def __init__(self, name, messages, params, code):
        self.name = name          # "start", "receive", "keyup", "keydown", etc.
        self.messages = messages  # None, string, or list of strings
        self.params = params      # list of param names
        self.code = code          # list of statements

    def to_dict(self):
        return {
            "message": self.messages,
            "code": [stmt.to_dict() for stmt in self.code]
        }


# =========================
# STATEMENTS
# =========================

class Broadcast(Node):
    def __init__(self, message, wait=False):
        self.message = message
        self.wait = wait

    def to_dict(self):
        return {
            "op": "broadcastAndWait" if self.wait else "broadcast",
            "fields": {"message": self.message}
        }


class CallEvent(Node):
    def __init__(self, name, args=None):
        self.name = name
        self.args = args or []

    def to_dict(self):
        return {
            "op": "call",
            "fields": {
                "name": self.name,
                "args": [a.to_dict() for a in self.args]
            }
        }


class CallFunction(Node):
    def __init__(self, name, args):
        self.name = name
        self.args = args

    def to_dict(self):
        return {
            "op": "call",
            "fields": {
                "name": self.name,
                "args": [a.to_dict() for a in self.args]
            }
        }


class MemberCall(Node):
    def __init__(self, target_sprite, member_name, args):
        self.target_sprite = target_sprite
        self.member_name = member_name
        self.args = args

    def to_dict(self):
        return {
            "op": "call",
            "fields": {
                "name": {
                    "kind": "member",
                    "args": [
                        {
                            "kind": "literal",
                            "type": "String",
                            "value": self.target_sprite
                        },
                        {
                            "kind": "literal",
                            "type": "String",
                            "value": self.member_name
                        }
                    ]
                },
                "args": [a.to_dict() for a in self.args]
            }
        }


# =========================
# EXPRESSIONS
# =========================

class Literal(Node):
    def __init__(self, type_, value):
        self.type = type_
        self.value = value

    def to_dict(self):
        return {
            "kind": "literal",
            "type": self.type,
            "value": self.value
        }


class Var(Node):
    def __init__(self, name):
        self.name = name

    def to_dict(self):
        return {
            "kind": "var",
            "name": self.name
        }


# =========================
# PARSER
# =========================

class Parser:
    def __init__(self, tokens, version, sprite):
        self.tokens = tokens
        self.i = 0
        self.version = version
        self.sprite = sprite

    # -------------
    # Token helpers
    # -------------
    def peek(self):
        return self.tokens[self.i] if self.i < len(self.tokens) else None

    def advance(self):
        tok = self.peek()
        self.i += 1
        return tok

    def match(self, *types):
        tok = self.peek()
        if tok and tok["type"] in types:
            self.advance()
            return tok
        return None

    def match_value(self, *values):
        tok = self.peek()
        if tok and tok["value"] in values:
            self.advance()
            return tok
        return None

    def expect(self, type_):
        tok = self.peek()
        if not tok or tok["type"] != type_:
            raise Exception(f"Expected {type_}, got {tok}")
        return self.advance()

    # -------------
    # Entry point
    # -------------
    def parse_program(self):
        globals_ = []
        vars_ = []
        functions = []
        events = []

        while self.peek():
            tok = self.peek()

            # variable declarations
            if tok["value"] in ("global", "public", "private"):
                kind = tok["value"]
                var_node = self.parse_var_decl(kind)
                if kind == "global":
                    globals_.append(var_node)
                else:
                    vars_.append(var_node)
                continue

            # events
            if tok["type"] == "AT_EVENT":
                events.append(self.parse_event_handler())
                continue

            # functions (not used in example yet, but reserved)
            if tok["value"] in ("function", "strict"):
                functions.append(self.parse_function())
                continue

            self.advance()

        return Program(self.version, self.sprite, globals_, vars_, functions, events)

    # -------------
    # Variable decl
    # -------------
    def parse_var_decl(self, kind):
        self.advance()  # consume global/public/private

        self.expect("IDENT")  # "var"
        name_tok = self.expect("IDENT")
        name = name_tok["value"]

        type_ = "*"
        if self.match("COLON"):
            type_tok = self.expect("IDENT")
            type_ = type_tok["value"]

        # optional semicolon
        self.match("SEMICOLON")

        if kind == "global":
            return Variable(name, type_, "global", True, False)
        elif kind == "public":
            return Variable(name, type_, "sprite", True, False)
        else:  # private
            return Variable(name, type_, "sprite", False, True)

    # -------------
    # Event handler
    # -------------
    def parse_event_handler(self):
        at = self.advance()  # AT_EVENT
        name = at["value"][1:]  # remove '@'

        messages = None
        params = []

        # @receive Message1, Message2 { }
        if name.lower() == "receive":
            if self.peek() and self.peek()["type"] == "IDENT":
                messages = []
                while self.peek() and self.peek()["type"] == "IDENT":
                    messages.append(self.advance()["value"])
                    self.match("COMMA")
        else:
            # params: either (key) or WKey, UpArrowKey, SpaceKey
            if self.match("LPAREN"):
                params = self.parse_param_list()
                self.expect("RPAREN")
            else:
                while self.peek() and self.peek()["type"] == "IDENT":
                    params.append(self.advance()["value"])
                    self.match("COMMA")

        self.expect("LBRACE")
        code = self.parse_block()
        self.expect("RBRACE")

        return EventHandler(name, messages, params, code)

    def parse_param_list(self):
        params = []
        while self.peek() and self.peek()["type"] != "RPAREN":
            if self.peek()["type"] == "IDENT":
                params.append(self.advance()["value"])
            self.match("COMMA")
        return params

    # -------------
    # Function (placeholder)
    # -------------
    def parse_function(self):
        strict = False
        if self.peek()["value"] == "strict":
            strict = True
            self.advance()

        self.expect("IDENT")  # "function"
        name = self.expect("IDENT")["value"]

        self.expect("LPAREN")
        params = self.parse_param_list()
        self.expect("RPAREN")

        return_type = "*"
        if self.match("COLON"):
            return_type = self.expect("IDENT")["value"]

        self.expect("LBRACE")
        code = self.parse_block()
        self.expect("RBRACE")

        # default visibility: public for now
        return Function(name, strict, params, return_type, True, False, code)

    # -------------
    # Block
    # -------------
    def parse_block(self):
        stmts = []
        while self.peek() and self.peek()["type"] != "RBRACE":
            stmt = self.parse_statement()
            if stmt:
                stmts.append(stmt)
            # optional semicolon
            self.match("SEMICOLON")
        return stmts

    # -------------
    # Statement
    # -------------
    def parse_statement(self):
        tok = self.peek()
        if not tok:
            return None

        # Broadcast / BroadcastAndWait
        if tok["value"] == "Broadcast":
            return self.parse_broadcast(wait=False)
        if tok["value"] == "BroadcastAndWait":
            return self.parse_broadcast(wait=True)

        # call @event or call function
        if tok["value"] == "call":
            return self.parse_call()

        # member call: this.something(...)
        if tok["type"] == "IDENT" and tok["value"] == "this":
            return self.parse_member_call()

        # plain function call: say("Hi")
        if tok["type"] == "IDENT":
            return self.parse_function_call()

        # fallback: consume token
        self.advance()
        return None

    def parse_broadcast(self, wait):
        self.advance()  # Broadcast or BroadcastAndWait
        msg_tok = self.expect("IDENT")
        message = msg_tok["value"]
        return Broadcast(message, wait=wait)

    def parse_call(self):
        self.advance()  # call

        # call @refresh
        if self.peek() and self.peek()["type"] == "AT_EVENT":
            at = self.advance()
            name = at["value"][1:]  # remove '@'
            return CallEvent(name)

        # call functionName(...)
        name_tok = self.expect("IDENT")
        name = name_tok["value"]

        args = []
        if self.match("LPAREN"):
            args = self.parse_arguments()
            self.expect("RPAREN")

        return CallFunction(name, args)

    def parse_member_call(self):
        # this.something(...)
        self.advance()  # "this"
        self.expect("DOT")
        member_name = self.expect("IDENT")["value"]

        self.expect("LPAREN")
        args = self.parse_arguments()
        self.expect("RPAREN")

        # target sprite is current sprite instance name
        return MemberCall(self.sprite, member_name, args)

    def parse_function_call(self):
        name = self.advance()["value"]  # IDENT
        args = []
        if self.match("LPAREN"):
            args = self.parse_arguments()
            self.expect("RPAREN")
        return CallFunction(name, args)

    # -------------
    # Expressions / arguments
    # -------------
    def parse_arguments(self):
        args = []
        while self.peek() and self.peek()["type"] != "RPAREN":
            args.append(self.parse_expression())
            self.match("COMMA")
        return args

    def parse_expression(self):
        tok = self.advance()
        if tok["type"] == "STRING":
            return Literal("String", tok["value"].strip("\""))
        if tok["type"] == "NUMBER":
            # you can refine type later (int vs Number)
            return Literal("Number", float(tok["value"]))
        if tok["type"] == "IDENT":
            return Var(tok["value"])
        return Literal("*", tok["value"])
