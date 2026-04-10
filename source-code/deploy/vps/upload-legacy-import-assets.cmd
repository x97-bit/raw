@echo off
setlocal

if "%~1"=="" (
  echo Usage: upload-legacy-import-assets.cmd ^<server-ip^> [server-user] [legacy-json-path]
  exit /b 1
)

set "SERVER_IP=%~1"
set "SERVER_USER=%~2"
if "%SERVER_USER%"=="" set "SERVER_USER=root"

set "SCRIPT_DIR=%~dp0"
set "DEFAULT_JSON=%SCRIPT_DIR%..\..\old db\AlrawiApp_all_data (1).json"
set "LEGACY_JSON=%~3"
if "%LEGACY_JSON%"=="" set "LEGACY_JSON=%DEFAULT_JSON%"

set "REMOTE_JSON=/root/alrawi-legacy-import.json"
set "REMOTE_SCRIPT=/root/run-legacy-import-on-vps.sh"

if not exist "%LEGACY_JSON%" (
  echo Legacy JSON file not found:
  echo %LEGACY_JSON%
  exit /b 1
)

echo Uploading legacy JSON export...
scp "%LEGACY_JSON%" %SERVER_USER%@%SERVER_IP%:%REMOTE_JSON%
if errorlevel 1 (
  echo Failed to upload legacy JSON export.
  exit /b 1
)

echo Uploading VPS legacy import helper...
scp "%SCRIPT_DIR%run-legacy-import-on-vps.sh" %SERVER_USER%@%SERVER_IP%:%REMOTE_SCRIPT%
if errorlevel 1 (
  echo Failed to upload VPS legacy import helper.
  exit /b 1
)

echo.
echo Upload complete.
echo Next on the VPS run:
echo chmod +x %REMOTE_SCRIPT%
echo bash %REMOTE_SCRIPT%
exit /b 0
