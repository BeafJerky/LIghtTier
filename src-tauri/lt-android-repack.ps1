# Android 重打包脚本（本机推荐流程，绕开 tauri CLI 的符号链接限制）：
# 1) pnpm build 产出前端 dist（Vite 7 需要 Node 20.19+，前置 nvm v26.4.0）
# 2) cargo 重编 libapp_lib.so（--features custom-protocol 生产模式：内嵌 dist 资源）
# 3) 复制 .so 到 jniLibs/arm64-v8a
# 4) Gradle 打包 arm64Release（-x rustBuildArm64Release，跳过 rust 插件任务）
# 5) apksigner 用 debug.keystore 签名（不存在则先运行 lt-android 首次构建流程）
# 用法: powershell -ExecutionPolicy Bypass -File .\lt-android-repack.ps1
$ErrorActionPreference = "Continue"
$env:Path = "$env:APPDATA\nvm\v26.4.0;" + $env:Path
$ndk = "D:\develop\Android\ndk\29.0.13846066"
$bin = "$ndk\toolchains\llvm\prebuilt\windows-x86_64\bin"
$env:ANDROID_HOME = "D:\develop\Android"
$env:ANDROID_NDK_HOME = $ndk
$env:NDK_HOME = $ndk
# Gradle/AGP 需要 JDK 17+（系统 JAVA_HOME 指向 1.8，此处显式覆盖）
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:Path = "$env:JAVA_HOME\bin;$bin;" + $env:Path
$env:CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER = "$bin\aarch64-linux-android24-clang.cmd"
$env:CC_aarch64_linux_android = "$bin\aarch64-linux-android24-clang.cmd"
$env:CXX_aarch64_linux_android = "$bin\aarch64-linux-android24-clang++.cmd"
$env:AR_aarch64_linux_android = "$bin\llvm-ar.exe"
$env:LIBCLANG_PATH = $bin
# bindgen 用 shlex 解析该变量，Windows 反斜杠会被当作转义符吞掉，必须用正斜杠
$sysroot = "D:/develop/Android/ndk/29.0.13846066/toolchains/llvm/prebuilt/windows-x86_64/sysroot"
$clangArgs = "--sysroot=$sysroot --target=aarch64-linux-android24"
${env:BINDGEN_EXTRA_CLANG_ARGS_aarch64-linux-android} = $clangArgs
${env:BINDGEN_EXTRA_CLANG_ARGS_aarch64_linux_android} = $clangArgs
if (Test-Path "D:\develop\Android\protoc\bin\protoc.exe") {
    $env:PROTOC = "D:\develop\Android\protoc\bin\protoc.exe"
}

$root = "d:\develop\otherProjects\LightTier"
$soSrc = "$root\src-tauri\target\aarch64-linux-android\release\libapp_lib.so"
$jniDir = "$root\src-tauri\gen\android\app\src\main\jniLibs\arm64-v8a"
$apkDir = "$root\src-tauri\gen\android\app\build\outputs\apk\arm64\release"

Write-Host "=== [1/5] pnpm build ==="
Set-Location $root
pnpm build *> "$env:TEMP\lt-repack-front.log"
if ($LASTEXITCODE -ne 0) { Write-Host "pnpm build FAILED, see $env:TEMP\lt-repack-front.log"; exit 1 }

Write-Host "=== [2/5] cargo build --release --target aarch64-linux-android --features custom-protocol ==="
Set-Location "$root\src-tauri"
cargo build --release --target aarch64-linux-android --features custom-protocol *> "$env:TEMP\lt-repack-cargo.log"
if ($LASTEXITCODE -ne 0) { Write-Host "cargo build FAILED, see $env:TEMP\lt-repack-cargo.log"; exit 1 }

Write-Host "=== [3/5] copy libapp_lib.so -> jniLibs ==="
New-Item -ItemType Directory -Path $jniDir -Force | Out-Null
Copy-Item $soSrc "$jniDir\libapp_lib.so" -Force

# 生产模式防回归校验：dev 模式编译的 .so 含 devUrl 代理错误串，到手机上会白屏
$soText = [System.Text.Encoding]::ASCII.GetString([System.IO.File]::ReadAllBytes("$jniDir\libapp_lib.so"))
if ($soText.Contains("Failed to request")) { Write-Host "FATAL: .so 是 dev 模式（缺 --features custom-protocol），中止"; exit 1 }
# 全量内嵌校验：dist 中全部 css/js 文件名都应出现在 .so 内嵌资源中
# （Vite 按 chunk 拆分命名哈希，抽查单个文件会漏检部分/未内嵌的情况）
$allAssets = @(Get-ChildItem "$root\dist\assets" -File | Where-Object { $_.Extension -in ".css", ".js" })
if ($allAssets.Count -eq 0) { Write-Host "FATAL: dist\assets 中未找到 css/js 资源"; exit 1 }
$missingAssets = @($allAssets | Where-Object { -not $soText.Contains($_.Name) } | ForEach-Object { $_.Name })
if ($missingAssets.Count -gt 0) { Write-Host "FATAL: 以下前端资源未内嵌到 .so: $($missingAssets -join ', ')"; exit 1 } else { Write-Host "production mode OK: all $($allAssets.Count) dist assets embedded" }

Write-Host "=== [4/5] gradlew assembleArm64Release -x rustBuildArm64Release ==="
Set-Location "$root\src-tauri\gen\android"
.\gradlew.bat assembleArm64Release -x rustBuildArm64Release *> "$env:TEMP\lt-repack-gradle.log"
if ($LASTEXITCODE -ne 0) { Write-Host "gradle FAILED, see $env:TEMP\lt-repack-gradle.log"; exit 1 }

Write-Host "=== [5/5] apksigner sign ==="
& "D:\develop\Android\build-tools\36.0.0\apksigner.bat" sign --ks "$env:USERPROFILE\.android\debug.keystore" --ks-pass pass:android --key-pass pass:android --ks-key-alias androiddebugkey --out "$apkDir\app-arm64-release-signed.apk" "$apkDir\app-arm64-release-unsigned.apk"
if ($LASTEXITCODE -ne 0) { Write-Host "apksigner FAILED"; exit 1 }

Write-Host "=== DONE: $apkDir\app-arm64-release-signed.apk ==="
