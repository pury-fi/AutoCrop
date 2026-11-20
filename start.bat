@echo off
title AutoCrop (PuryFi)
cd /d "%~dp0"

echo [AutoCrop] Starting plugin...
call npm start

if %ERRORLEVEL% neq 0 (
    echo.
    echo [AutoCrop] Execution error. (Code %ERRORLEVEL%)
    pause
)
