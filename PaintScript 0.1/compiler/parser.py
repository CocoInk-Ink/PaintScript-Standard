# parser.py

# =========================================================
# AST NODE DEFINITIONS
# =========================================================

class Node:
    pass


class Program(Node):
    def __init__(self, version, sprite, events, functions):
        self.version = version
        self.sprite = sprite
        self.events = events
        self.functions = functions

    def to_dict(self):
        return {
            "version": self.version,
            "sprite": self.sprite,
            "events": [e.to_dict() for e in self.events],
            "functions": [f.to_dict() for f in self.functions]
        }


class Event(Node):
    def __init__(self, name, params, body):
        self.name = name
        self.params = params
        self.body = body

    def to_dict(self):
        return {
            "type": "event",
            "name": self.name,
            "params": self.params,
            "body": self.body.to_dict()
        }


class Function(Node):
    def __init__(self, name, params, return_type, strict, body):
        self.name = name
        self.params = params
        self.return_type = return_type
        self.strict = strict
        self.body = body

    def to_dict(self):
        return {
            "type": "function",
            "name": self.name,
            "params": self.params,
            "return": self.return_type,
            "strict": self.strict,
            "body": self.body.to_dict()
        }


class Block(Node):
    def __init__(self, statements):
        self.statements = statements

    def to_dict(self):
        return {
            "type": "block",
            "statements": [s.to_dict() for s in self.statements]
        }


# ---------------- STATEMENTS ----------------

class Assignment(Node):
    def __init__(self, target, value):
        self.target = target
        self.value = value

    def to_dict(self):
        return {
            "type": "assign",
            "target": self.target,
            "value": self.value.to_dict()
        }


class Call(Node):
    def __init__(self, name, args):
        self.name = name
        self.args = args

    def to_dict(self):
        return {
            "type": "call",
            "name": self.name,
            "args": [a.to_dict() for a in self.args]
        }


class If(Node):
    def __init__(self, condition, then_block, else_block=None):
        self.condition = condition
        self.then_block = then_block
        self.else_block = else_block

    def to_dict(self):
        return {
            "type": "if",
            "condition": self.condition.to_dict(),
            "then": self.then_block.to_dict(),
            "else": self.else_block.to_dict() if self.else_block else None
        }


class Repeat(Node):
    def __init__(self, mode, condition, body):
        self.mode = mode  # "times", "until", "while", "forever"
        self.condition = condition
        self.body = body

    def to_dict(self):
        return {
            "type": "repeat",
            "mode": self.mode,
            "condition": self.condition.to_dict() if self.condition else None,
            "body": self.body.to_dict()
        }


# ---------------- EXPRESSIONS ----------------

class Literal(Node):
    def __init__(self, value):
        self.value = value

    def to_dict(self):
        return {"type": "literal", "value": self.value}


class Var(Node):
    def __init__(self, name):
        self.name = name

    def to_dict(self):
        return {"type": "var", "name": self.name}


class BinaryOp(Node):
    def __init__(self, op, left, right):
        self.op = op
        self.left = left
        self.right = right

    def to_dict(self):
        return {
            "type": "binary",
            "op": self.op,
            "left": self.left.to_dict(),
            "right": self.right.to_dict()
        }


class UnaryOp(Node):
    def __init__(self, op, expr):
        self.op = op
        self.expr = expr

    def to_dict(self):
        return {
            "type": "unary",
            "op": self.op,
            "expr": self.expr.to_dict()
        }


# =========================================================
# PARSER
# =========================================================

class Parser:
    def __init__(self, tokens, version, sprite):
        self.tokens = tokens
        self.i = 0
        self.version = version
        self.sprite = sprite

    # ---------------- TOKEN HELPERS ----------------

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

    # =========================================================
    # PROGRAM
    # =========================================================

    def parse_program(self):
        events = []
        functions = []

        while self.peek():
            tok = self.peek()

            if tok["type"] == "AT_EVENT":
                events.append(self.parse_event())
                continue

            if tok["value"] == "function" or tok["value"] == "strict":
                functions.append(self.parse_function())
                continue

            self.advance()  # skip unknown

        return Program(self.version, self.sprite, events, functions)

    # =========================================================
    # EVENT
    # =========================================================

    def parse_event(self):
        header = self.advance()
        name = header["value"][1:]

        params = []
        if self.match("LPAREN"):
            params = self.parse_params()
            self.expect("RPAREN")

        self.expect("LBRACE")
        body = self.parse_block()
        self.expect("RBRACE")

        return Event(name, params, body)

    # =========================================================
    # FUNCTION
    # =========================================================

    def parse_function(self):
        strict = False

        if self.peek()["value"] == "strict":
            strict = True
            self.advance()

        self.expect("IDENT")  # "function"
        name = self.advance()["value"]

        self.expect("LPAREN")
        params = self.parse_params()
        self.expect("RPAREN")

        return_type = None
        if self.match("COLON"):
            return_type = self.advance()["value"]

        self.expect("LBRACE")
        body = self.parse_block()
        self.expect("RBRACE")

        return Function(name, params, return_type, strict, body)

    # =========================================================
    # BLOCK
    # =========================================================

    def parse_block(self):
        statements = []

        while self.peek() and self.peek()["type"] != "RBRACE":
            statements.append(self.parse_statement())

        return Block(statements)

    # =========================================================
    # STATEMENTS
    # =========================================================

    def parse_statement(self):
        tok = self.peek()

        # if (...)
        if tok["value"] == "if":
            return self.parse_if()

        # repeat(...)
        if tok["value"] == "repeat":
            return self.parse_repeat()

        # forever { }
        if tok["value"] == "forever":
            return self.parse_forever()

        # assignment or call
        return self.parse_simple_statement()

    # ---------------- IF ----------------

    def parse_if(self):
        self.advance()  # consume "if"
        self.expect("LPAREN")
        condition = self.parse_expression()
        self.expect("RPAREN")

        self.expect("LBRACE")
        then_block = self.parse_block()
        self.expect("RBRACE")

        else_block = None
        if self.match_value("else"):
            self.expect("LBRACE")
            else_block = self.parse_block()
            self.expect("RBRACE")

        return If(condition, then_block, else_block)

    # ---------------- REPEAT ----------------

    def parse_repeat(self):
        self.advance()  # repeat

        # repeat until(condition)
        if self.match_value("until"):
            self.expect("LPAREN")
            cond = self.parse_expression()
            self.expect("RPAREN")
            self.expect("LBRACE")
            body = self.parse_block()
            self.expect("RBRACE")
            return Repeat("until", cond, body)

        # repeat(n)
        self.expect("LPAREN")
        cond = self.parse_expression()
        self.expect("RPAREN")
        self.expect("LBRACE")
        body = self.parse_block()
        self.expect("RBRACE")
        return Repeat("times", cond, body)

    # ---------------- FOREVER ----------------

    def parse_forever(self):
        self.advance()  # forever
        self.expect("LBRACE")
        body = self.parse_block()
        self.expect("RBRACE")
        return Repeat("forever", None, body)

    # ---------------- SIMPLE STATEMENT ----------------

    def parse_simple_statement(self):
        # IDENT = expr
        if self.peek()["type"] == "IDENT":
            ident = self.advance()["value"]

            # assignment
            if self.match("OP") and self.tokens[self.i - 1]["value"] == "=":
                value = self.parse_expression()
                return Assignment(ident, value)

            # function call
            if self.match("LPAREN"):
                args = self.parse_arguments()
                self.expect("RPAREN")
                return Call(ident, args)

        # fallback literal
        return Literal(self.advance()["value"])

    # =========================================================
    # EXPRESSIONS
    # =========================================================

    def parse_expression(self):
        # Simple expression: IDENT, NUMBER, STRING
        tok = self.advance()

        if tok["type"] == "NUMBER":
            return Literal(float(tok["value"]))

        if tok["type"] == "STRING":
            return Literal(tok["value"])

        if tok["type"] == "IDENT":
            return Var(tok["value"])

        return Literal(tok["value"])

    # =========================================================
    # PARAMS & ARGS
    # =========================================================

    def parse_params(self):
        params = []
        while self.peek() and self.peek()["type"] != "RPAREN":
            if self.peek()["type"] == "IDENT":
                params.append(self.advance()["value"])
            self.match("COMMA")
        return params

    def parse_arguments(self):
        args = []
        while self.peek() and self.peek()["type"] != "RPAREN":
            args.append(self.parse_expression())
            self.match("COMMA")
        return args
