@echo off
echo ===================================================
echo Pushing Apex WOS to GitHub Repository
echo Target: https://github.com/philosisglobalservices-ship-it/Apex-WOS.git
echo ===================================================

git remote remove origin 2>nul
git remote add origin https://github.com/philosisglobalservices-ship-it/Apex-WOS.git
git branch -M main
git add .
git commit -m "feat: complete warehouse operating system with Zero-Trust RBAC and Supabase cloud database"
git push -u origin main

pause
