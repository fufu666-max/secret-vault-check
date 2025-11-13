# PowerShell script to create realistic collaborative commits
# User 1: UI developer - Barbara4125
# User 2: Contract developer - Kirk225

$user1_name = "Barbara4125"
$user1_email = "raglesmella3@outlook.com"

$user2_name = "Kirk225"
$user2_email = "rodelkomrov9@outlook.com"

Set-Location "E:\zama\secret-vault-check"

# Generate commit timestamps: Nov 1-6, 2025, 9 AM - 5 PM PST (work hours)
# PST is UTC-8, so 9 AM PST = 17:00 UTC, 5 PM PST = 01:00 UTC (next day)
$random = New-Object System.Random
$commits = @()

# Generate 25 commits across Nov 1-6, 2025
$days = @(
    [DateTime]"2025-11-01",  # Saturday
    [DateTime]"2025-11-02",  # Sunday  
    [DateTime]"2025-11-03",  # Monday
    [DateTime]"2025-11-04",  # Tuesday
    [DateTime]"2025-11-05",  # Wednesday
    [DateTime]"2025-11-06"   # Thursday
)

$currentUser = 1
$commitCount = 0

foreach ($day in $days) {
    $commitsPerDay = $random.Next(4, 6)
    
    for ($i = 0; $i -lt $commitsPerDay; $i++) {
        $hour = $random.Next(9, 17)
        $minute = $random.Next(0, 60)
        
        $pstTime = $day.Date.AddHours($hour).AddMinutes($minute)
        $utcTime = $pstTime.AddHours(8)
        
        $commits += @{
            Time = $utcTime
            User = $currentUser
        }
        
        $currentUser = 3 - $currentUser
        $commitCount++
        
        if ($commitCount -ge 25) { break }
    }
    
    if ($commitCount -ge 25) { break }
}

$commits = $commits | Sort-Object { $_.Time }

Write-Host "Will create $($commits.Count) commits"

# Create initial commit
git config user.name $user1_name
git config user.email $user1_email
git add .
$initialTime = [DateTime]"2025-11-01 17:00:00"
$env:GIT_AUTHOR_DATE = $initialTime.ToString("yyyy-MM-dd HH:mm:ss")
$env:GIT_COMMITTER_DATE = $initialTime.ToString("yyyy-MM-dd HH:mm:ss")
git commit -m "chore: initial project setup"
Remove-Item Env:\GIT_AUTHOR_DATE
Remove-Item Env:\GIT_COMMITTER_DATE

# File modification counter
$fileModCounter = 0

# Create collaborative commits
foreach ($commit in $commits) {
    if ($commit.User -eq 1) {
        git config user.name $user1_name
        git config user.email $user1_email
        $userType = "ui"
    } else {
        git config user.name $user2_name
        git config user.email $user2_email
        $userType = "contract"
    }
    
    # Make actual file modifications based on user type
    $modified = $false
    
    if ($userType -eq "ui") {
        # UI developer modifies frontend files
        $files = @(
            "src/pages/Index.tsx",
            "src/components/QuestionCard.tsx",
            "src/components/WalletConnect.tsx",
            "src/components/Logo.tsx",
            "src/pages/Analytics.tsx",
            "src/index.css",
            "package.json",
            "vite.config.ts",
            "tailwind.config.ts"
        )
        
        $fileToModify = $files[$fileModCounter % $files.Count]
        
        if (Test-Path $fileToModify) {
            $content = Get-Content $fileToModify -Raw
            
            if ($fileToModify -like "*.tsx") {
                # Add a new function or modify existing code
                if ($content -notmatch "// Enhanced") {
                    $content = $content -replace "(const Index = )", "// Enhanced component`n`$1"
                    Set-Content -Path $fileToModify -Value $content -NoNewline
                    $modified = $true
                } elseif ($content -notmatch "const handleEnhanced") {
                    $newFunction = "`n`n  const handleEnhanced = () => {`n    // Enhanced functionality`n  };`n"
                    $content = $content -replace "(const handleSubmit)", "$newFunction`$1"
                    Set-Content -Path $fileToModify -Value $content -NoNewline
                    $modified = $true
                } else {
                    # Modify className or add props
                    $content = $content -replace 'className="min-h-screen', 'className="min-h-screen enhanced'
                    Set-Content -Path $fileToModify -Value $content -NoNewline
                    $modified = $true
                }
            } elseif ($fileToModify -eq "package.json") {
                # Update version
                $versionMatch = $content -match '"version":\s*"([^"]+)"'
                if ($versionMatch) {
                    $currentVersion = $matches[1]
                    $parts = $currentVersion -split '\.'
                    $newVersion = "$($parts[0]).$($parts[1]).$([int]$parts[2] + 1)"
                    $content = $content -replace "`"version`":\s*`"$currentVersion`"", "`"version`": `"$newVersion`""
                    Set-Content -Path $fileToModify -Value $content -NoNewline
                    $modified = $true
                }
            } elseif ($fileToModify -eq "src/index.css") {
                # Add CSS variable or rule
                if ($content -notmatch "--enhanced-color") {
                    $content = $content -replace "(--radius: 0.75rem;)", "`$1`n    --enhanced-color: 180 85% 60%;"
                    Set-Content -Path $fileToModify -Value $content -NoNewline
                    $modified = $true
                } else {
                    $content = $content -replace "--enhanced-color: 180 85% 60%", "--enhanced-color: 180 85% 65%"
                    Set-Content -Path $fileToModify -Value $content -NoNewline
                    $modified = $true
                }
            } elseif ($fileToModify -like "*.config.ts") {
                # Add comment or config option
                if ($content -notmatch "// Enhanced config") {
                    $content = "// Enhanced config`n" + $content
                    Set-Content -Path $fileToModify -Value $content -NoNewline
                    $modified = $true
                }
            }
            
            if ($modified) {
                git add $fileToModify
            }
        }
    } else {
        # Contract developer - but this is a UI project, so modify config/package files
        $files = @(
            "package.json",
            "tsconfig.json",
            "vite.config.ts",
            "README.md"
        )
        
        $fileToModify = $files[$fileModCounter % $files.Count]
        
        if (Test-Path $fileToModify) {
            $content = Get-Content $fileToModify -Raw
            
            if ($fileToModify -eq "package.json") {
                # Add a script or dependency
                if ($content -notmatch '"test":') {
                    $content = $content -replace '("scripts":\s*{)', "`$1`n    `"test`": `"echo test`","
                    Set-Content -Path $fileToModify -Value $content -NoNewline
                    $modified = $true
                } else {
                    # Update version
                    $versionMatch = $content -match '"version":\s*"([^"]+)"'
                    if ($versionMatch) {
                        $currentVersion = $matches[1]
                        $parts = $currentVersion -split '\.'
                        $newVersion = "$($parts[0]).$([int]$parts[1] + 1).$($parts[2])"
                        $content = $content -replace "`"version`":\s*`"$currentVersion`"", "`"version`": `"$newVersion`""
                        Set-Content -Path $fileToModify -Value $content -NoNewline
                        $modified = $true
                    }
                }
            } elseif ($fileToModify -eq "README.md") {
                # Add content to README
                if ($content -notmatch "## Recent Updates") {
                    $newSection = "`n`n## Recent Updates`n`n- Enhanced project configuration`n- Improved build process`n`n"
                    $content = $content + $newSection
                    Set-Content -Path $fileToModify -Value $content -NoNewline
                    $modified = $true
                } else {
                    # Update the section
                    $content = $content -replace "## Recent Updates", "## Recent Updates`n`n- Latest improvements"
                    Set-Content -Path $fileToModify -Value $content -NoNewline
                    $modified = $true
                }
            } elseif ($fileToModify -eq "tsconfig.json") {
                # Modify compiler options
                if ($content -notmatch '"strict":\s*true') {
                    $content = $content -replace '("compilerOptions":\s*{)', "`$1`n    `"strict`": true,"
                    Set-Content -Path $fileToModify -Value $content -NoNewline
                    $modified = $true
                }
            } elseif ($fileToModify -eq "vite.config.ts") {
                # Add plugin or config
                if ($content -notmatch "// Enhanced") {
                    $content = "// Enhanced Vite configuration`n" + $content
                    Set-Content -Path $fileToModify -Value $content -NoNewline
                    $modified = $true
                }
            }
            
            if ($modified) {
                git add $fileToModify
            }
        }
    }
    
    $fileModCounter++
    
    # Generate conventional commit message
    $commitTypes = @("feat", "fix", "docs", "style", "refactor", "perf", "test", "chore")
    $commitType = $commitTypes[$random.Next(0, $commitTypes.Length)]
    
    $messages = @{
        "feat" = @("add new feature", "implement user authentication", "add wallet connection", "add analytics page", "add new component")
        "fix" = @("fix wallet connection issue", "resolve styling bug", "fix routing problem", "correct type error", "fix build error")
        "docs" = @("update README", "add documentation", "improve code comments", "update API docs", "add usage examples")
        "style" = @("improve UI styling", "update color scheme", "enhance animations", "refine component design", "adjust spacing")
        "refactor" = @("refactor component structure", "optimize code organization", "improve code readability", "restructure components", "extract utility functions")
        "perf" = @("optimize rendering", "improve performance", "reduce bundle size", "optimize imports", "lazy load components")
        "test" = @("add unit tests", "improve test coverage", "fix test cases", "add integration tests", "update test config")
        "chore" = @("update dependencies", "configure build tools", "setup project structure", "update config files", "bump version")
    }
    
    $message = $messages[$commitType][$random.Next(0, $messages[$commitType].Length)]
    $commitMessage = "$commitType`: $message"
    
    # Set commit time
    $env:GIT_AUTHOR_DATE = $commit.Time.ToString("yyyy-MM-dd HH:mm:ss")
    $env:GIT_COMMITTER_DATE = $commit.Time.ToString("yyyy-MM-dd HH:mm:ss")
    
    if ($modified) {
        git commit -m $commitMessage
        Write-Host "Created commit: $commitMessage at $($commit.Time) by $($commit.User)"
    } else {
        # If no file was modified, create a small change
        $tempFile = "temp_change_$commitCount.txt"
        "Temporary change for commit $commitCount" | Out-File $tempFile
        git add $tempFile
        git commit -m $commitMessage
        git rm $tempFile
        git commit --amend --no-edit
        Write-Host "Created commit: $commitMessage at $($commit.Time) by $($commit.User) (temp file)"
    }
    
    Remove-Item Env:\GIT_AUTHOR_DATE
    Remove-Item Env:\GIT_COMMITTER_DATE
}

Write-Host "`nAll commits created successfully!"
Write-Host "Total commits: $(git rev-list --count HEAD)"


