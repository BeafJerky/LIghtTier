# 手动打包管线（绕开 tauri CLI 的符号链接步骤，Windows 未开开发者模式时使用）：
# 1) cargo 已产出 target/aarch64-linux-android/release/libapp_lib.so 并复制进 jniLibs/arm64-v8a
# 2) 直接跑 Gradle 打包 arm64Release，跳过 rust 构建任务（-x rustBuildArm64Release）
$ErrorActionPreference = "Continue"
$ndk = "D:\develop\Android\ndk\29.0.13846066"
$env:ANDROID_HOME = "D:\develop\Android"
$env:ANDROID_NDK_HOME = $ndk
$env:NDK_HOME = $ndk
# Gradle/AGP 需要 JDK 17+（系统 JAVA_HOME 指向 1.8，此处显式覆盖）
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path
Set-Location "d:\develop\otherProjects\LightTier\src-tauri\gen\android"
Write-Host "=== gradle assembleArm64Release (-x rustBuildArm64Release) ==="
.\gradlew.bat assembleArm64Release -x rustBuildArm64Release 2>&1 | Tee-Object -FilePath "$env:TEMP\lt-gradle-build.log"
Write-Host "=== done, exit=$LASTEXITCODE ==="
