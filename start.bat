@echo off
title AutoCrop Plugin (PuryFi)
cd /d "%~dp0"

echo [AutoCrop] Baue und starte Plugin...
call npm start

if %ERRORLEVEL% neq 0 (
    echo.
    echo [AutoCrop] Fehler beim Ausfuehren. (Code %ERRORLEVEL%)
    pause
)
