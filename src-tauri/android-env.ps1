# Android 构建公共环境配置
# 使用环境变量 + 默认值模式，支持不同开发者机器
# 用法: 在各构建脚本中 . "$PSScriptRoot\android-env.ps1"

$script:ANDROID_NDK_HOME = $env:ANDROID_NDK_HOME ?? "D:\develop\Android\ndk\29.0.13846066"
$script:ANDROID_HOME     = $env:ANDROID_HOME     ?? "D:\develop\Android"
$script:JAVA_HOME        = $env:JAVA_HOME         ?? "C:\Program Files\Java\jdk-17"

$script:NDK_BIN = "$script:ANDROID_NDK_HOME\toolchains\llvm\prebuilt\windows-x86_64\bin"

# --- 环境变量导出 ---
$env:ANDROID_HOME     = $script:ANDROID_HOME
$env:ANDROID_NDK_HOME = $script:ANDROID_NDK_HOME
$env:NDK_HOME         = $script:ANDROID_NDK_HOME
$env:JAVA_HOME        = $script:JAVA_HOME

# --- NDK 工具链 (linker / clang / ar) ---
$env:CARGO_TARGET_AARCH64_LINUX_ANDROID_LINKER = "$script:NDK_BIN\aarch64-linux-android24-clang.cmd"
$env:CC_aarch64_linux_android  = "$script:NDK_BIN\aarch64-linux-android24-clang.cmd"
$env:CXX_aarch64_linux_android = "$script:NDK_BIN\aarch64-linux-android24-clang++.cmd"
$env:AR_aarch64_linux_android  = "$script:NDK_BIN\llvm-ar.exe"
$env:LIBCLANG_PATH = $script:NDK_BIN

# --- bindgen (Windows 反斜杠会被 shlex 当转义符，sysroot 必须用正斜杠) ---
$sysroot = "$script:ANDROID_NDK_HOME/toolchains/llvm/prebuilt/windows-x86_64/sysroot" -replace '\\', '/'
$clangArgs = "--sysroot=$sysroot --target=aarch64-linux-android24"
${env:BINDGEN_EXTRA_CLANG_ARGS_aarch64-linux-android} = $clangArgs
${env:BINDGEN_EXTRA_CLANG_ARGS_aarch64_linux_android} = $clangArgs

# --- protoc (可选，存在则设置) ---
$protocPath = "$script:ANDROID_HOME\protoc\bin\protoc.exe"
if (Test-Path $protocPath) {
    $env:PROTOC = $protocPath
}

# --- Cargo 网络配置 ---
$env:CARGO_NET_GIT_FETCH_WITH_CLI = "true"
$env:CARGO_HTTP_MULTIPLEXING      = "false"
$env:CARGO_HTTP_TIMEOUT           = "120"
$env:CARGO_NET_RETRY              = "10"
