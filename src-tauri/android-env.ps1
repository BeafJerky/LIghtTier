# Android 构建公共环境配置
# 使用环境变量 + 默认值模式，支持不同开发者机器
# 用法: 在各构建脚本中 . "$PSScriptRoot\android-env.ps1"

# 注意: 构建脚本经 Windows PowerShell 5.1 调用（见 lt-repack-all.ps1），不可使用 pwsh 7 专有的 ?? 运算符
$script:ANDROID_NDK_HOME = if ($env:ANDROID_NDK_HOME) { $env:ANDROID_NDK_HOME } else { "D:\develop\Android\ndk\29.0.13846066" }
$script:ANDROID_HOME     = if ($env:ANDROID_HOME)     { $env:ANDROID_HOME }     else { "D:\develop\Android" }
$script:JAVA_HOME        = if ($env:JAVA_HOME)        { $env:JAVA_HOME }        else { "C:\Program Files\Java\jdk-17" }

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
$llvmPrebuilt = "$script:ANDROID_NDK_HOME\toolchains\llvm\prebuilt\windows-x86_64"
$sysroot = "$llvmPrebuilt/sysroot" -replace '\\', '/'
# clang 内置头(stddef.h/stdint.h 等)位于资源目录 lib/clang/<ver>/include；
# libclang 交叉编译时不会自动加入该目录，bindgen 会因找不到 stddef.h 而失败，需显式 -isystem
$clangResDir = (Get-ChildItem "$llvmPrebuilt\lib\clang" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName
$clangResInclude = "$clangResDir/include" -replace '\\', '/'
$clangArgs = "--sysroot=$sysroot --target=aarch64-linux-android24 -isystem $clangResInclude"
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
