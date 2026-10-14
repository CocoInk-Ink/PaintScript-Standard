# type_checker.py

class TypeEnv:
    def __init__(self):
        self.vars = {}      # name -> type
        self.funcs = {}     # name -> (param_types, return_type)

    def add_var(self, name, type_):
        self.vars[name] = type_

    def get_var(self, name):
        return self.vars.get(name, "*")

    def add_func(self, name, param_types, return_type):
        self.funcs[name] = (param_types, return_type)

    def get_func(self, name):
        return self.funcs.get(name, ([], "*"))


def can_assign(to_type, from_type):
    if to_type == from_type:
        return True
    if from_type == "empty":
        return True
    if to_type == "*" or from_type == "*":
        return True
    # simple conversions: String <-> Number/int
    if to_type in ("Number", "int") and from_type == "String":
        return True
    if to_type == "String" and from_type in ("Number", "int"):
        return True
    return False


def expr_type(env, expr):
    from parser import Literal, Var  # adjust import if needed

    if isinstance(expr, Literal):
        return expr.type
    if isinstance(expr, Var):
        return env.get_var(expr.name)
    return "*"


def check_program(program):
    from parser import Variable, Function, Broadcast, CallFunction, CallEvent, MemberCall

    env = TypeEnv()

    # globals
    for g in program.globals:
        env.add_var(g.name, g.type)

    # sprite vars
    for v in program.vars:
        env.add_var(v.name, v.type)

    # functions
    for f in program.functions:
        param_types = ["*"] * len(f.parameters)  # you can refine later
        env.add_func(f.name, param_types, f.return_type)

    # events + code
    for e in program.events:
        for stmt in e.code:
            check_stmt(env, stmt)


def check_stmt(env, stmt):
    from parser import Broadcast, CallFunction, CallEvent, MemberCall

    if isinstance(stmt, Broadcast):
        # messages are untyped, always ok
        return

    if isinstance(stmt, CallEvent):
        # events are built-in, no type check here
        return

    if isinstance(stmt, CallFunction):
        param_types, ret_type = env.get_func(stmt.name)
        # basic arity check
        if len(stmt.args) != len(param_types):
            print(f"[TypeWarning] Function '{stmt.name}' called with wrong number of args.")
        # argument type check
        for i, arg in enumerate(stmt.args):
            arg_t = expr_type(env, arg)
            expected = param_types[i] if i < len(param_types) else "*"
            if not can_assign(expected, arg_t):
                print(f"[TypeError] Arg {i} to '{stmt.name}' expected {expected}, got {arg_t}.")

    if isinstance(stmt, MemberCall):
        # for now, assume member calls are valid; you can add a member type table later
        return
