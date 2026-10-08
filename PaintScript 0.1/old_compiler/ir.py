# ir.py

def ast_to_json(node):
    if isinstance(node, Program):
        return {
            "version": node.version,
            "sprite": node.sprite,
            "globals": node.globals,
            "publics": node.publics,
            "vars": node.vars,
            "events": [ast_to_json(e) for e in node.events],
            "functions": [ast_to_json(f) for f in node.functions]
        }

    if isinstance(node, Event):
        return {
            "type": "event",
            "name": node.name,
            "params": node.params,
            "body": ast_to_json(node.body)
        }

    if isinstance(node, Function):
        return {
            "type": "function",
            "name": node.name,
            "params": node.params,
            "return": node.return_type,
            "strict": node.strict,
            "body": ast_to_json(node.body)
        }

    if isinstance(node, Block):
        return {
            "type": "block",
            "statements": [ast_to_json(s) for s in node.statements]
        }

    if isinstance(node, Literal):
        return {"type": "literal", "value": node.value}

    return {"type": "unknown"}
