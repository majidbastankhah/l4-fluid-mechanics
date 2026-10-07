@echo off
rem Publish the course website: stage, commit and push all changes to GitHub.
rem Double-click this file, type a short description of the change, press Enter.
cd /d "%~dp0"
echo.
echo Changes to be published:
git status --short
echo.
set "MSG="
set /p "MSG=Describe the change in a few words (Enter = Update course materials): "
if not defined MSG set "MSG=Update course materials"
git add -A
git diff --cached --quiet && echo Nothing new to commit. && goto push
git commit -m "%MSG%"
:push
git push
if errorlevel 1 (
  echo.
  echo PUSH FAILED - see the message above. Nothing on the website has changed.
) else (
  echo.
  echo Done. The website will update in a few minutes.
)
echo.
pause
