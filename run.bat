cd %~dp0

cd "PaintScript 0.1"
cd "compiler"

rmdir /s /q sessions

node compiler.js "Sprite 1" "Sprite_1" ..\Sample.pxs --session abc123