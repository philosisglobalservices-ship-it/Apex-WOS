@echo off
setlocal
echo ===================================================
echo   Apex WOS - Pushing to GitHub
echo   Repository: https://github.com/philosisglobalservices-ship-it/Apex-WOS.git
echo ===================================================
echo.

cd /d "c:\Users\User\Desktop\Enterprises"

echo [1/4] Ensuring branch is named 'main'...
git branch -M main

echo [2/4] Verifying remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/philosisglobalservices-ship-it/Apex-WOS.git
git remote -v

echo.
echo [3/4] Staging and committing all project files...
git add .
git -c user.name="philosisglobalservices-ship-it" -c user.email="philosisglobalservices@users.noreply.github.com" commit -m "feat: complete warehouse operating system with Zero-Trust RBAC and Supabase cloud database"

echo.
echo [4/4] Pushing to GitHub (main branch)...
echo (If a GitHub sign-in window or browser prompt appears, please authorize it)
echo.
git push -u origin main

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ===================================================
    echo Standard push failed or needs force-sync.
    echo Retrying with force-push in case remote had existing files...
    echo ===================================================
    git push -u origin main --force
)

echo.
echo ===================================================
echo Done! Please check output above to confirm push succeeded.
echo ===================================================
pause
