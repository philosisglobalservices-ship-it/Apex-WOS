Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Apex WOS - Pushing to GitHub" -ForegroundColor Cyan
Write-Host "  Repository: https://github.com/philosisglobalservices-ship-it/Apex-WOS.git" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path "c:\Users\User\Desktop\Enterprises"

Write-Host "[1/4] Ensuring branch is named 'main'..." -ForegroundColor Gray
git branch -M main

Write-Host "[2/4] Setting remote origin..." -ForegroundColor Gray
git remote remove origin 2>$null
git remote add origin https://github.com/philosisglobalservices-ship-it/Apex-WOS.git
git remote -v

Write-Host "[3/4] Staging and committing all files..." -ForegroundColor Gray
git add .
git -c user.name="philosisglobalservices-ship-it" -c user.email="philosisglobalservices@users.noreply.github.com" commit -m "feat: complete warehouse operating system with Zero-Trust RBAC and Supabase cloud database"

Write-Host "[4/4] Pushing to GitHub main branch..." -ForegroundColor Cyan
Write-Host "(Please approve the Git Credential / GitHub browser sign-in prompt if it appears)" -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "Standard push had conflicts or remote files. Retrying with --force..." -ForegroundColor Yellow
    git push -u origin main --force
}

Write-Host "===================================================" -ForegroundColor Green
Write-Host "Push complete! Visit: https://github.com/philosisglobalservices-ship-it/Apex-WOS" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green
