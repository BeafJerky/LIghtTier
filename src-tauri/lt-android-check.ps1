$ErrorActionPreference = "Continue"
$ndk = "D:\develop\Android\ndk\29.0.13846066"
$bin = "$ndk\toolchains\llvm\prebuilt\windows-x86_64\bin"
$env:ANDROID_HOME = "D:\develop\Android"
$env:ANDROID_NDK_HOME = $ndk
$env:NDK_HOME = $ndk
$env:CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER = "$bin\aarch64-linux-android24-clang.cmd"
$env:CC_aarch64_linux_android = "$bin\aarch64-linux-android24-clang.cmd"
$env:CXX_aarch64_linux_android = "$bin\aarch64-linux-android24-clang++.cmd"
$env:AR_aarch64_linux_android = "$bin\llvm-ar.exe"
$env:LIBCLANG_PATH = $bin
$env:Path = "$bin;" + $env:Path
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
Set-Location "d:\develop\otherProjects\LightTier\src-tauri"
Write-Host "=== rustup targets ==="
rustup target list --installed
Write-Host "=== cargo check for aarch64-linux-android ==="
cargo check --target aarch64-linux-android --message-format short 2>&1 | Tee-Object -FilePath "$env:TEMP\lt-android-check.log" | Select-Object -Last 100
Write-Host "=== done, exit=$LASTEXITCODE ==="
