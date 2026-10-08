cd %~dp0

mkdir "dist"

uglifyjs ast_nodes.js compiler.js ir.js linker.js parser.js tokenizer.js typechecker.js -o dist/output.js -c -m