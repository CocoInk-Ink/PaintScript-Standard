cd "PaintScript 0.1"
cd "compiler"

rem Compile
python compiler.py Sprite_1 ..\Sample.pxs --session abc123

rem Link
rem python compiler.py --link --session abc123