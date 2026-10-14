# ast_nodes.py

class Node:
    pass

class Program(Node):
    def __init__(self, version, sprite, globals, publics, vars, events, functions):
        self.version = version
        self.sprite = sprite
        self.globals = globals
        self.publics = publics
        self.vars = vars
        self.events = events
        self.functions = functions

class Event(Node):
    def __init__(self, name, params, body):
        self.name = name
        self.params = params
        self.body = body

class Function(Node):
    def __init__(self, name, params, return_type, strict, body):
        self.name = name
        self.params = params
        self.return_type = return_type
        self.strict = strict
        self.body = body

# Statements
class Block(Node):
    def __init__(self, statements):
        self.statements = statements

class VarAssign(Node):
    def __init__(self, target, value):
        self.target = target
        self.value = value

class If(Node):
    def __init__(self, condition, then_block, else_block=None):
        self.condition = condition
        self.then_block = then_block
        self.else_block = else_block

class Repeat(Node):
    def __init__(self, condition, body, mode):
        self.condition = condition
        self.body = body
        self.mode = mode  # "times", "until", "while", "forever"

class Call(Node):
    def __init__(self, name, args):
        self.name = name
        self.args = args

# Expressions
class BinaryOp(Node):
    def __init__(self, op, left, right):
        self.op = op
        self.left = left
        self.right = right

class UnaryOp(Node):
    def __init__(self, op, expr):
        self.op = op
        self.expr = expr

class Var(Node):
    def __init__(self, name):
        self.name = name

class Literal(Node):
    def __init__(self, value):
        self.value = value
