cd %~dp0

if not exist "dist" mkdir "dist"

call npx webpack --config "%CD%\webpack.config.cjs"
if errorlevel 1 exit /b %errorlevel%

copy /Y "%CD%\dist\output.js" "%CD%\..\..\..\Assets\Resources\Binary\Runtimes\r0.1.0.js" >nul
if errorlevel 1 exit /b %errorlevel%