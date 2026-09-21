# LightTier Git 提交与版本号规范

> 生成时间：2026-09-19依据：工程实际配置——`commitlint.config.cjs`、`.husky/commit-msg`、`.husky/pre-commit`、`.husky/lintstagedrc.cjs`、`src-tauri/tauri.conf.json5` 等用途：统一提交信息与版本号实践；**修改上述配置时必须同步更新本文档**

## 一、提交信息规范（Conventional Commits）

### 1.1 基本格式

```
<type>(<scope>): <subject>

[body]

[footer]
```

- `type`：必填，必须是 1.2 节 15 种枚举之一，**全小写**
- `scope`：可选，小写英文单词（见 1.3），表示改动范围
- `subject`：必填，一句话说明「做了什么」；与冒号之间保留一个空格
- `body`：可选，空行分隔，说明「为什么」与影响面
- `footer`：可选，空行分隔，写 `BREAKING CHANGE:`、issue 关联等

硬性校验（`commit-msg` 钩子自动执行，违反即拒绝提交）：

| 检查项           | 规则                                 |
| ---------------- | ------------------------------------ |
| type             | 必须在 1.2 的 15 种枚举内且小写      |
| scope            | 若填写必须小写                       |
| 标题长度         | 总长（含 type/scope 前缀）≤ 100 字符 |
| subject          | 不能为空                             |
| body / footer 行 | 每行 ≤ 100 字符                      |

> 注：项目已关闭 `subject-case`（大小写）与 `subject-full-stop`（结尾标点）检查，中英文标题均可，但仍建议结尾不加句号。

### 1.2 type 枚举（与 commitlint.config.cjs 完全一致）

| type     | 含义             | 本项目典型场景                                           |
| -------- | ---------------- | -------------------------------------------------------- |
| feat     | 新功能           | 新增页面/功能、新增主题、新增配置项                      |
| fix      | 修复 bug         | 崩溃、逻辑错误、交互缺陷                                 |
| docs     | 文档             | doc/、README、代码注释性文档                             |
| style    | 格式与样式       | 不影响逻辑的格式调整、样式微调                           |
| refactor | 重构             | 既不新增功能也不修 bug 的代码调整                        |
| perf     | 性能优化         | 启动速度、渲染与打包体积优化                             |
| test     | 测试             | 新增/修改 `src/utils/__tests__` 用例                     |
| ci       | 持续集成         | `.github/workflows` 修改                                 |
| chore    | 杂项             | 依赖升级、工具链与编辑器配置                             |
| revert   | 回滚             | 回滚历史提交（`git revert` 自动生成标题）                |
| workflow | 工作流改进       | 开发/发布流程、脚本（**项目自定义**）                    |
| mod      | 不确定分类的修改 | 难以归类的小改动，尽量少用（**项目自定义**）             |
| wip      | 开发中           | 阶段性暂存，**禁止推送到 main**（**项目自定义**）        |
| types    | 类型定义修改     | `types/`、`*.d.ts`、TS 类型调整（**项目自定义**）        |
| release  | 版本发布         | 发布提交，必须同步版本号（见第二部分）（**项目自定义**） |

### 1.3 scope 建议清单（可选，全小写）

| scope      | 范围                                        |
| ---------- | ------------------------------------------- |
| desktop    | Windows 桌面端壳与桌面专属行为              |
| android    | Android 端                                  |
| ui         | 界面与组件（components / layout / views）   |
| config     | 配置管理（config-view）                     |
| monitor    | 运行监控                                    |
| web-config | Web 配置                                    |
| overview   | 概览页                                      |
| theme      | 主题系统（内置与外部主题）                  |
| i18n       | 多语言（locales）                           |
| core       | 内核版本下载/安装/运行                      |
| build      | 构建、打包与相关脚本                        |
| deps       | 依赖变更                                    |
| tauri      | Tauri 壳、权限（capabilities）、配置        |
| vpnservice | Android VPN 插件（tauri-plugin-vpnservice） |
| store      | 状态管理（pinia）                           |
| doc        | 项目文档                                    |

- 一次提交跨多个范围时：可省略 scope，或取影响最大的一个
- 常见组合示例：`feat(theme): ...`、`fix(android): ...`、`docs(doc): ...`

### 1.4 subject 写法

- 用陈述句说明改动，技术名词保留原文（如 `on-accent`、`versionCode`）
- 建议 ≤ 50 字符（硬上限 100）
- 不以句号结尾；避免「update code」「修复问题」这类无信息量描述

### 1.5 body 与 footer

- body：解释**动机**与**影响面**；破坏性变更必须写明
- footer 常用写法：
  - 破坏性变更：`BREAKING CHANGE: 配置格式变更说明`（也可在标题加 `!`，如 `feat!: ...`）
  - 关联 issue：`Closes #12`、`Refs #34`
  - 回滚提交：`Revert "feat(theme): ..."`（`git revert` 自动生成）
- `[skip ci]`：提交信息包含该标记时跳过 commitlint 校验（仅限特殊场景）

### 1.6 完整示例

```
feat(theme): 新增 cyberpunk-2077 外部主题

补齐 The Matrix 配色，包含变量定义与 THEME_GUIDE 变量表。
Closes #6
```

```
fix(core): 修复内核解压后启动路径错误

压缩包一级目录结构与预期不一致导致启动失败，改为按实际一级目录定位。
```

会被拒绝 / 不应出现的写法：

| 写法                 | 问题                      |
| -------------------- | ------------------------- |
| `update`             | 缺少 type                 |
| `Feat(ui): 新增按钮` | type 必须小写             |
| `feat(UI): 新增按钮` | scope 必须小写            |
| `feat: `             | subject 为空              |
| 标题超过 100 字符    | 超出上限，commitlint 拒绝 |

### 1.7 校验钩子（husky 实际行为）

| 钩子 | 命令（工程实际配置） | 作用 |
| --- | --- | --- |
| commit-msg | `npx --no -- commitlint --edit $1` | 按 1.1 规则校验提交信息 |
| pre-commit | `npm run ts:check` + `npm run lint:lint-staged` | vue-tsc 全量类型检查；对暂存文件按 `.husky/lintstagedrc.cjs` 自动 eslint / prettier / stylelint 修复并回写暂存区 |

- 任一钩子失败即拒绝提交；lint-staged 的自动修复会重新加入暂存区，通常无需手工再处理
- 不推荐 `--no-verify` 跳过钩子；紧急跳过会绕过类型检查与规范校验，造成仓库历史不一致

## 二、版本号规范

### 2.1 格式

- 采用语义化版本（SemVer）：`MAJOR.MINOR.PATCH`，如 `1.0.0`、`1.1.0`、`1.1.3`
- 预发布（可选）：`1.2.0-beta.1`、`1.2.0-rc.1`
- Git tag：`vX.Y.Z`（如 `v1.1.0`）
- 历史说明：首个正式版为 `1.0.0`，tag 写作 `v1.0`；自下一次发布起 tag 统一三位式 `vX.Y.Z`，历史 `v1.0` 保留不再重打

### 2.2 递增规则

| 递增位 | 触发条件                                                             | 示例          |
| ------ | -------------------------------------------------------------------- | ------------- |
| MAJOR  | 不兼容的重大变更：配置格式不兼容、最低系统要求变化、需要用户手动迁移 | 1.4.0 → 2.0.0 |
| MINOR  | 向后兼容的新功能：新页面/模块、新主题、新配置项                      | 1.0.0 → 1.1.0 |
| PATCH  | 向后兼容的修复：bug 修复、文案、样式微调                             | 1.0.0 → 1.0.1 |

原则：

- **版本号只在 `release` 提交中变更**；`feat` / `fix` 等日常提交不动版本号
- 一次发布只递增一位；同时含新功能与破坏性变更时以最高位为准
- 双端（Windows / Android）共用同一版本号，任一端发布都应双端同步出包，避免版本漂移

### 2.3 版本号落点（发布时必须同步的文件）

| # | 文件 | 字段 | 说明 |
| --- | --- | --- | --- |
| 1 | `package.json` | `version` | 前端与元信息 |
| 2 | `src-tauri/tauri.conf.json5` | `version` | 桌面安装包文件名、后端版本来源 |
| 3 | `src-tauri/Cargo.toml` | `[package] version` | Rust 侧版本 |
| 4 | `CHANGELOG.md` | 新增 `## X.Y.Z (YYYY-MM-DD)` 段落 | 与现有 1.0.0 段落风格一致 |

自动项（**禁止手改**）：

- `src-tauri/Cargo.lock`：构建时自动同步
- `src-tauri/gen/android/app/tauri.properties`：`tauri android build` 时由 CLI 自动生成 `versionName` / `versionCode`（当前 `1.0.0` → `versionCode=1000000`，规则为 `major×1000000 + minor×1000 + patch`，天然保证 Android 端 versionCode 严格递增）
- 安装包 / APK 文件名与版本信息均取自上述配置，无需单独维护

### 2.4 发布流程（标准步骤）

1. **自检**：工作区无未提交改动；`pnpm ts:check`、`pnpm test`、`pnpm build` 全部通过
2. **更新版本号**：按 2.3 同步 3 个配置文件 + CHANGELOG
3. **发布提交**：`release: vX.Y.Z <一句话发布说明>` 例：`release: v1.1.0 新增 xxx`
4. **打 tag**：`git tag -a vX.Y.Z -m "LightTier vX.Y.Z"`
5. **推送**：`git push origin main && git push origin vX.Y.Z`
6. **双端打包**：`powershell -ExecutionPolicy Bypass -File src-tauri/lt-repack-all.ps1`
   - 产物：NSIS / MSI（Windows）、`app-arm64-release-signed.apk`（Android）
7. **GitHub Release**（可选）：以第 6 步产物为附件，正文摘录 CHANGELOG 对应段落

### 2.5 常见场景

| 场景                   | 处理                                                    |
| ---------------------- | ------------------------------------------------------- |
| 仅 Android 端修复      | 升 PATCH，双端同步出包（保持版本一致）                  |
| 紧急热修复             | 直接在 main 修复后走完整发布流程，升 PATCH              |
| 预发布验证             | 先发 `X.Y.Z-beta.1`（tag 同名），稳定后发正式版         |
| 补打遗漏 tag           | `git tag -a vX.Y.Z <commit> -m "..."` 后推送该 tag      |
| 修改最近一次未推送提交 | `git commit --amend`；**已推送的提交禁止 amend / 强推** |

## 三、提交前自检清单

- [ ] type 在 1.2 枚举内且小写；scope 小写
- [ ] 标题 ≤ 100 字符，冒号后有空格，结尾无句号
- [ ] 破坏性变更已在 footer 写 `BREAKING CHANGE:`
- [ ] 用户可见文案已同步 `src/locales/zh-CN.ts` 与 `en.ts`
- [ ] 若是 `release` 提交：2.3 的 4 处落点已全部更新
- [ ] 未使用 `--no-verify` 跳过钩子

## 相关文件

- 提交校验配置：`commitlint.config.cjs`
- 钩子：`.husky/commit-msg`、`.husky/pre-commit`、`.husky/lintstagedrc.cjs`
- 版本落点：`package.json`、`src-tauri/tauri.conf.json5`、`src-tauri/Cargo.toml`、`CHANGELOG.md`
- 双端打包脚本：`src-tauri/lt-repack-all.ps1`
