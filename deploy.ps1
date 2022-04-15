param (
    [string] $message = "site rebuild" + (Get-Date -UFormat "%A %m/%d/%Y %R %Z")
)

Write-Host "Deploying updates to Github"

hugo -t hermit --enableGitInfo

cd public

git add .

git commit -m $message

git push origin main

cd ..

git add .

git commit -m $message

git push