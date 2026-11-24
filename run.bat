@echo off

cd /d "%~dp0"

cd "PaintScript 0.1\CompilerAndRuntime\compiler"

if exist sessions rmdir /s /q sessions

call tsc

cd build

node compiler.js

pause

:: node compiler.js "Sprite 1" "Sprite_1" ..\Sample.pxs --session abc123

:: node compiler.js "Sprite 1" "Player" ..\Game.pxs --session abc123