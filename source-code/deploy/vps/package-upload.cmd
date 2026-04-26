@echo off
setlocal

if "%~1"=="" (
  echo Usage: package-upload.cmd ^<server-ip^> [server-user]
  exit /b 1
)

set "SERVER_IP=%~1"
set "SERVER_USER=%~2"
if "%SERVER_USER%"=="" set "SERVER_USER=root"

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..\..") do set "REPO_ROOT=%%~fI"
set "OUT_DIR=%REPO_ROOT%\.release"
set "ARCHIVE=%OUT_DIR%\alrawi-source-code.zip"
set "REMOTE_ARCHIVE=/root/alrawi-source-code.zip"
set "REMOTE_SCRIPT=/root/deploy-on-vps.sh"

if not exist "%OUT_DIR%" mkdir "%OUT_DIR%"
if exist "%ARCHIVE%" del /f /q "%ARCHIVE%"

echo Creating clean source-code archive...
git -C "%REPO_ROOT%" archive --format=zip --output="%ARCHIVE%" HEAD:source-code
if errorlevel 1 (
  echo Failed to create archive.
  exit /b 1
)

echo Uploading release archive...
scp "%ARCHIVE%" %SERVER_USER%@%SERVER_IP%:%REMOTE_ARCHIVE%
if errorlevel 1 (
  echo Failed to upload archive.
  exit /b 1
)

echo Uploading deploy helper...
scp "%SCRIPT_DIR%deploy-on-vps.sh" %SERVER_USER%@%SERVER_IP%:%REMOTE_SCRIPT%
if errorlevel 1 (
  echo Failed to upload deploy helper.
  exit /b 1
)

echo.
echo Upload complete.
echo Executing deployment script on the VPS automatically...
ssh %SERVER_USER%@%SERVER_IP% "chmod +x %REMOTE_SCRIPT% && bash %REMOTE_SCRIPT%"
if errorlevel 1 (
  echo Deployment script failed!
  exit /b 1
)

echo.
echo Deployment finished successfully!
exit /b 0
