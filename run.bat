cd "PaintScript 0.1"
cd "compiler"

rmdir /s /q sessions

rem Compile
python compiler.py "Sprite 1" "Sprite_1" ..\Sample.pxs --session abc123

rem Link
python compiler.py --link --session abc123