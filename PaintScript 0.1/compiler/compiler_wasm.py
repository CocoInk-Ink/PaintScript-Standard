# compiler_wasm.py

import os
import json

# Import your existing compiler modules
import compiler
import linker

def compile_script(sprite_name, instance_name, script_path, session_id):
    """
    This function is the WASM entry point.
    It runs the compiler exactly as-is, using the WASI filesystem.
    """

    # Run the compiler (writes files into /sessions/<id>/)
    compiler.compile_file(sprite_name, instance_name, script_path, session_id)

    # Run the linker (writes linked.json)
    linker.link_session(session_id)

    # Return the path to the linked file (C# will read it directly)
    return f"/sessions/{session_id}/linked.json"
