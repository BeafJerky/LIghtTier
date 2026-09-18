$ErrorActionPreference = "Continue"
# Vite 7 需要 Node 20.19+（系统默认 18.20.4），优先使用 nvm 下的 v26.4.0
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
$env:CARGO_NET_GIT_FETCH_WITH_CLI = "true"
$env:CARGO_HTTP_MULTIPLEXING = "false"
$env:CARGO_HTTP_TIMEOUT = "120"
$env:CARGO_NET_RETRY = "10"
Set-Location "d:\develop\otherProjects\LightTier"
Write-Host "=== tauri android build (aarch64 APK) ==="
pnpm tauri android build --apk --target aarch64 2>&1 | Tee-Object -FilePath "$env:TEMP\lt-android-build.log"
Write-Host "=== done, exit=$LASTEXITCODE ==="
