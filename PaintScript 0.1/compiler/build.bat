cd %~dp0

if not exist "dist" mkdir "dist"

call npx webpack --config "%CD%\webpack.config.cjs"
if errorlevel 1 exit /b %errorlevel%