$ErrorActionPreference = "Continue"
# Vite 7 需要 Node 20.19+（系统默认 18.20.4），优先使用 nvm 下的 v26.4.0
$env:Path = "$env:APPDATA\nvm\v26.4.0;" + $env:Path

# 公共 Android 构建环境（NDK / clang / bindgen / protoc / cargo 网络）
. "$PSScriptRoot\android-env.ps1"
$env:Path = "$env:JAVA_HOME\bin;$env:NDK_BIN;" + $env:Path

Set-Location "d:\develop\otherProjects\LightTier"
Write-Host "=== tauri android build (aarch64 APK) ==="
pnpm tauri android build --apk --target aarch64 2>&1 | Tee-Object -FilePath "$env:TEMP\lt-android-build.log"
Write-Host "=== done, exit=$LASTEXITCODE ==="
