@echo off
setlocal

if "%~1"=="" goto usage

set "SERVER_IP=%~1"
set "SERVER_USER=%~2"
if "%SERVER_USER%"=="" set "SERVER_USER=root"

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..\..\old db\AlrawiApp_all_data (1).json") do set "DEFAULT_JSON=%%~fI"
if "%~3"=="" (
  set "LEGACY_JSON=%DEFAULT_JSON%"
) else (
  for %%I in ("%~3") do set "LEGACY_JSON=%%~fI"
)

set "REMOTE_JSON=/root/alrawi-legacy-import.json"
set "REMOTE_SCRIPT=/root/run-legacy-import-on-vps.sh"

if exist "%LEGACY_JSON%" goto have_json
echo Legacy JSON file not found:
echo %LEGACY_JSON%
exit /b 1

:have_json

echo Uploading legacy JSON export...
scp "%LEGACY_JSON%" %SERVER_USER%@%SERVER_IP%:%REMOTE_JSON%
if errorlevel 1 goto upload_json_failed

echo Uploading VPS legacy import helper...
scp "%SCRIPT_DIR%run-legacy-import-on-vps.sh" %SERVER_USER%@%SERVER_IP%:%REMOTE_SCRIPT%
if errorlevel 1 goto upload_script_failed

echo.
echo Upload complete.
echo Next on the VPS run:
echo chmod +x %REMOTE_SCRIPT%
echo bash %REMOTE_SCRIPT%
exit /b 0

:usage
echo Usage: upload-legacy-import-assets.cmd ^<server-ip^> [server-user] [legacy-json-path]
exit /b 1

:upload_json_failed
echo Failed to upload legacy JSON export.
exit /b 1

:upload_script_failed
echo Failed to upload VPS legacy import helper.
exit /b 1
