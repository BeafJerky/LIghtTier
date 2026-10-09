# Changelog

## 1.1.0 (2026-10-09)

> 工程质量发布：集中清理历史“打补丁”式配置、恢复类型严格性、收敛权限，无新增用户功能。

- 构建与配置
  - vite.config.ts 移除 `defineModel`（Vue 3.5 默认开启）、`undefined` 占位插件、冗余 `resolve.extensions` 与无用 `/api` proxy、`hmr.overlay`
  - `.env.*` 删除未使用变量（`VITE_API_BASE_PATH` / `VITE_USE_MOCK` / `VITE_USE_ONLINE_ICON` / `VITE_HIDE_GLOBAL_SETTING`），标题统一为 LightTier
  - package.json 移除未使用依赖（`@element-plus/icons-vue`、`mitt`、`rollup`、`vite-plugin-eslint` 等）与重复脚本
  - eslint 扁平配置将 `ignores` 拆为独立全局段（修复忽略未全局生效），禁用规则补 TODO 说明
  - 启用 Cargo `[profile.release]`（`lto` / `codegen-units=1` / `opt-level=s` / `strip`），减小体积并优化产物
- 类型与代码质量
  - tsconfig 恢复 `noImplicitAny` / `strictFunctionTypes`，补全 store / utils / plugins 显式类型标注
  - `types/*.d.ts` 移除 `declare global` 内冗余 `declare`、补 `export {}` 保持模块身份、裁剪未使用全局类型
  - 删除 elementPlus 插件注释死代码（101 行）；`lib.rs` 提取公共 `log_format` 并将 `println!` 改为 `log` 宏
- 安全
  - 移除 `src/constants/easytier.ts` 中硬编码的 `COOKIE_VALUE` 密钥
  - 收敛 Tauri capabilities：移除 `fs:read-all` / `fs:write-all` / `shell:allow-execute` / `shell:allow-spawn` 等过宽权限与未使用命令白名单，删除冗余 `desktop.json`
- 工程脚本与插件
  - 新增 `src-tauri/android-env.ps1` 集中 Android 构建环境，`lt-android-*.ps1` 改为引用去重
  - vpnservice 插件移除 `ping` / `registerListener` 脚手架示例（重命名为 `register_listener`），统一 pnpm 与 `@tauri-apps/api` 版本

## 1.0.0 (2026-08-26)

- 项目独立：全新仓库与全新提交历史，保留新版控制台全部功能
  - 移除老版控制台全部代码（旧视图 / 旧布局 / 旧组件 / axios 等），不再与老版项目产生任何构建期或运行时依赖
  - 保留全部新版功能：配置管理、运行监控、Web 配置、服务安装、退出路由、内核下载、主题系统、多语言、托盘、锁屏
  - 品牌化：产品名 LightTier、全新应用图标、`com.lighttier.app` 标识符
  - 精简 store（app.ts 从 349 行减至 104 行）、依赖瘦身、locales 裁剪（仅保留 `new*` 键）
