Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "Pushing Apex WOS to GitHub Repository" -ForegroundColor Cyan
Write-Host "Target: https://github.com/philosisglobalservices-ship-it/Apex-WOS.git" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan

git remote remove origin 2>$null
git remote add origin https://github.com/philosisglobalservices-ship-it/Apex-WOS.git
git branch -M main
git add .
git commit -m "feat: complete warehouse operating system with Zero-Trust RBAC and Supabase cloud database"
git push -u origin main
