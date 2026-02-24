---
title: 我的ClaudeCode使用笔记
published: 2025-09-20T19:33:12
updated: 2026-02-25T00:39:47
description: 'Claude Code 实用指南与技巧汇总。涵盖安装配置、核心命令、MCP模块、子智能体、Hooks钩子、Skills技能系统、自定义命令等完整使用笔记，助你高效使用 AI 编程助手。'
image: '/images/claude.webp'
tags: [AI, ClaudeCode使用笔记]

draft: false
lang: ''
---
# ClaudeCode使用笔记

## 📌 概述

Claude Code 是 Anthropic 推出的 **AI 智能编程工具**，可在终端、IDE、桌面应用和浏览器中运行。它能直接读取代码库、执行命令、修改文件、管理 Git 工作流，并通过 MCP 协议连接外部服务。

## 文档目录

## 🧭ClaudeCode官方文档

有空更建议研究ClaudeCode官方文档

::link{url="https://docs.claude.com/zh-CN/docs/claude-code/overview" title="Claude Code 概述 - Claude Docs" description="Claude Code 官方中文文档"}

---

## 🚀 安装与认证

### 安装方式

```bash
# macOS / Linux / WSL（推荐原生安装）
curl -fsSL https://claude.ai/install.sh | bash

# Windows 安装（Powershell）
irm https://claude.ai/install.ps1 | iex

# 更新到最新版本
claude update

# 健康检查
claude doctor
```

## **Setting.Json解析，个人开发适用**

<details>
<summary>键值与结构体</summary>

| **`cleanupPeriodDays`** | 非活动时间超过此期间的会话在启动时被删除。设置为 **`0`** 立即删除所有会话。（默认：30 天） |
| --- | --- |
| **`model`** | 覆盖 Claude Code 使用的默认模型 |
| **`alwaysThinkingEnabled`** | 为所有会话默认启用 [**扩展思考**](https://code.claude.com/docs/zh-CN/common-workflows#use-extended-thinking-thinking-mode) ，默认开启 |
| **`autoUpdatesChannel`** | 配置 Claude Code 为自动更新 默认为**`latest`** ，可改为**`stable`**  |
| **`statusLine` 结构体** | 配置自定义状态行以显示上下文。请参阅 [**`statusLine` 文档**](https://code.claude.com/docs/zh-CN/statusline) |
| **`attribution` 结构体** | 是否在 git 提交和拉取请求中包含 **`co-authored-by Claude`** 署名，默认开启 |
| **`defaultMode`** | 打开 Claude Code 时的默认[**权限模式](https://code.claude.com/docs/zh-CN/permissions#permission-modes)** 建议为**plan** |

</details>

<details>
<summary>环境变量</summary>

| **`ANTHROPIC_AUTH_TOKEN`** | **`Authorization`** 标头的自定义值（您在此处设置的值将以 **`Bearer`** 为前缀） |
| --- | --- |
| **`ANTHROPIC_BASE_URL`** | 自定义请求端点 |
| **`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`** | 设置触发自动压缩的上下文容量百分比（1-100）。默认情况下，自动压缩在约 95% 容量时触发。 |
| **`CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION`** | 提示建议，设置为**`flase`** 禁用 |
| **`CLAUDE_CODE_MAX_OUTPUT_TOKENS`** | 为大多数请求设置最大输出令牌数。默认：32,000。最大：64,000。增加此值会减少在 [**自动压缩**](https://code.claude.com/docs/zh-CN/costs#reduce-token-usage) 触发之前可用的有效上下文窗口。 |
| **`CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS`** | 覆盖文件读取的默认令牌限制。当您需要完整读取较大文件时很有用默认为**`16000`**，最大**`100000`** |
| **`MAX_THINKING_TOKENS`** | 思考预算，默认为31999（最大）0为禁用，Opus4.6由努力级别控制 |
| **`MCP_TIMEOUT`** | MCP 服务器启动的超时 建议**`60000`** |
| **`MCP_TOOL_TIMEOUT`** | MCP 工具执行的超时 建议**`120000`** |
| **`BASH_DEFAULT_TIMEOUT_MS`** | 长时间运行的 bash 命令的默认超时 建议**`300000`** |
| **`BASH_MAX_TIMEOUT_MS`** | 模型可以为长时间运行的 bash 命令设置的最大超时 建议**`600000`** |
| **`CLAUDE_CODE_EFFORT_LEVEL`** | Opus4.6加入的控制努力级别 值：**`low`**、**`medium`**、**`high`**（默认） |

</details>

<details>
<summary>个人配置示例（2026.1.31）</summary>

补充：关于我的StatusLine，需要先安装依赖：`npx ccstatusline@latest`

[GitHub - sirmalloc/ccstatusline: 🚀 Beautiful highly customizable statusline for Claude Code CLI with powerline support, themes, and more.](https://github.com/sirmalloc/ccstatusline)

```json
{
  "alwaysThinkingEnabled": true,
  "attribution": {
    "commit": " ",
    "pr": " "
  },
  "autoUpdatesChannel": "latest",
  "defaultMode": "plan",
  "enabledPlugins": {
    "context7@claude-plugins-official": true,
    "csharp-lsp@claude-plugins-official": true,
    "document-skills@anthropic-agent-skills": true,
    "example-skills@anthropic-agent-skills": true,
    "frontend-design@claude-plugins-official": true
  },
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "你的APIKey",
    "ANTHROPIC_BASE_URL": "自定义端点",
    "BASH_DEFAULT_TIMEOUT_MS": "300000",
    "BASH_MAX_TIMEOUT_MS": "600000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "70",
    "CLAUDE_CODE_ATTRIBUTION_HEADER": "0",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS": "32000",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "52000",
    "DISABLE_AUTOUPDATER": "1",
    "DISABLE_ERROR_REPORTING": "1",
    "DISABLE_TELEMETRY": "1",
    "MAX_THINKING_TOKENS": "31999",
    "MCP_TIMEOUT": "60000",
    "MCP_TOOL_TIMEOUT": "120000"
  },
  "model": "opusplan",
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(npm run:*)",
      "Bash(pnpm run:*)",
      "Bash(npx:*)",
      "Bash(node:*)",
      "Bash(git:*)",
      "Bash(dotnet:*)",
      "Bash(msbuild:*)",
      "Bash(python:*)",
      "Bash(uv:*)",
      "Bash(pip:*)",
      "Bash(pytest:*)",
      "Bash(where:*)",
      "Bash(dir:*)",
      "Bash(type:*)",
      "Bash(echo:*)",
      "Edit(src/**)",
      "Edit(tests/**)",
      "Edit(Assets/Scripts/**)",
      "Edit(Assets/Editor/**)"
    ],
    "deny": []
  },
  "statusLine": {
    "command": "ccstatusline",
    "type": "command"
  }
}
```

</details>


## 认证

请在启动前在你的***.claude.json***里面添加这行，即`hasCompletedOnboarding` 的值为true

或者使用CC-Switch里面设置跳过首次登陆即可

```json
"hasCompletedOnboarding": true,
```

---

## 🎯 核心 CLI 命令

| **命令** | **中文说明** | **示例** |
| --- | --- | --- |
| `claude` | 启动交互式 REPL 会话 | `claude` |
| `claude "query"` | 带初始提示启动会话 | `claude "explain this project"` |
| `claude -p "query"` | 单次查询后退出（适合脚本） | `claude -p "review this code"` |
| **`*claude --dangerously-skip-permissions*`** | 彻底疯狂模式，给予所有权限 |  |

---

## 个人建议装载插件、Skil

| **命令** | **中文说明** |
| --- | --- |
| **`claude plugin install frontend-design@claude-plugins-official`** | 前端设计 |
| **`claude plugin install context7@claude-plugins-official`** | 提供较新文档给AI，有效防止因训练数据落后的"幻觉" |
| **`claude -p "queryclaude plugin install csharp-lsp@claude-plugins-official`** | 为 C# 项目提供丰富的代码智能 |
| **`npx claude-plugins install @anthropics/anthropic-agent-skills/document-skills`** | 文档处理套件合集，包括Excel、Word、PowerPoint和PDF功能 |
| **`npx claude-plugins install @anthropics/anthropic-agent-skills/example-skills`** | 展示多种能力的示例技能集合，包括技能创建、MCP构建、视觉设计、算法艺术、内部沟通、网页测试、工件构建、Slack GIF和主题样式 |
| **`npx skills add [https://github.com/vercel-labs/skills](https://github.com/vercel-labs/skills) --skill find-skills`** | 这项技能帮助你发现并安装开放代理技能生态系统中的技能。 |
| **`npx skills add [https://github.com/vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) --skill vercel-react-best-practices`** | 由Vercel维护的React和Next.js应用综合性能优化指南。包含8个类别的57条规则，按影响优先级排序，指导自动重构和代码生成。 |
| **`npx skills add [https://github.com/nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) --skill ui-ux-pro-max`** | 设计很棒的 原仓库：https://github.com/nextlevelbuilder/ui-ux-pro-max-skill |
| **`npx skills add [https://github.com/coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) --skill seo-audit`** | SEO优化 |
| 在UnityPackageManager ：**`https://github.com/Besty0728/Unity-Skills.git?path=/SkillsForUnity`** | Unity-Skills，本人开发 https://github.com/Besty0728/Unity-Skills |

---

## ⚡ 交互式斜杠命令（Slash Commands）

| **命令** | **中文说明** |
| --- | --- |
| `/help` | 显示所有可用命令（含自定义命令） |
| **`/init`** | **初始化项目，创建 [CLAUDE.md](http://CLAUDE.md) 记忆文件** |
| `/memory` | 编辑记忆文件 [CLAUDE.md](http://CLAUDE.md) |
| **`/compact`** | **压缩对话历史以节省上下文窗口（可加焦点：`/compact focus on tests`）** |
| `/context` | 查看当前上下文窗口使用情况 |
| `/cost` | 显示当前会话的 Token 用量与费用 |
| `/stats` | 查看使用统计信息 |
| `/model` | 切换 AI 模型（`/model opus`） |
| `/status` | 查看当前会话状态（模型、设置等） |
| `/config` | 打开设置交互界面 |
| `/permissions` | 管理权限设置 |
| `/mcp` | 配置 MCP 外部服务（`/mcp enable` / `/mcp disable`） |
| `/hooks` | 查看 Hook 钩子配置 |
| `/agents` | 管理子智能体（创建、编辑、列表、删除） |
| **`/resume`** | **恢复已命名的会话** |
| `/rename` | 给当前会话命名（`/rename feature-auth`） |
| `/fork` | 分支对话，探索不同方向而不丢失上下文 |
| `/clear` | 清空对话历史，重新开始 |
| **`/rewind`** | **回退到上一个检查点（撤销更改）** |
| `/export` | 导出对话记录 |
| `/vim` | 启用 Vim 编辑模式 |
| **`/ide`** | **连接到 IDE（VS Code / JetBrains）** |
| `/sandbox` | 启用沙盒隔离模式 |
| `/output-style` | 设置输出风格（`Explanatory` / `Learning` / `Concise`） |
| `/add-dir` | 添加工作目录 |
| `/doctor` | 检查安装状态 |
| `/release-notes` | 查看版本更新日志 |

---

## 🔤 快捷前缀

| **前缀** | **中文说明** | **示例** |
| --- | --- | --- |
| `#` | 添加内容到持久化记忆（[CLAUDE.md](http://CLAUDE.md)） | `# Always use TypeScript` |
| `@` | 引用文件或目录 | `@src/index.ts` |
| `!` | 直接执行 shell 命令 | `! git status` |
| `/` | 执行斜杠命令 | `/help` |
| `&` | 发送任务到云端异步执行 | `& Build the API` |

---

## ⌨️ 键盘快捷键（Windows）

| **快捷键** | **中文说明** |
| --- | --- |
| `Ctrl+C` | 取消当前操作 |
| `Ctrl+D` | 退出会话 |
| `Ctrl+L` | 清屏（保留历史） |
| `Ctrl+O` | 切换详细输出模式（查看推理过程） |
| `Ctrl+R` | 搜索命令历史 |
| **`Alt+V`**  | **从剪贴板粘贴图片** |
| `Ctrl+B` | 将当前任务转为后台运行 |
| `Esc Esc` | 撤销/回退上一次更改 |
| `Tab` | 接受提示建议 / 切换扩展思考模式 |
| **`Shift+Tab`** | **循环切换权限模式** |
| `Alt+P` / `Option+P` | 输入时切换模型 |
| **`Ctrl+Enter`** | 换行输入 |

---

## 🧠 模型选择指南

官方还支持以下格式快捷调用：

| **模型别名** | **行为** |
| --- | --- |
| **`default`** | 推荐的模型设置，取决于你的账户类型 |
| **`sonnet`** | 使用最新的 Sonnet 模型（当前为 Sonnet 4.5）用于日常编码任务 |
| **`opus`** | 使用最新的 Opus 模型（当前为 Opus 4.6）用于复杂推理任务 |
| **`haiku`** | 使用快速高效的 Haiku 模型用于简单任务 |
| **`sonnet[1m]`** | 使用 Sonnet 和[**100 万 token 上下文窗口**](https://platform.claude.com/docs/en/build-with-claude/context-windows#1m-token-context-window)用于长会话 |
| **`opusplan` 推荐** | 特殊模式，在计划模式中使用 **`opus`**，然后在执行时切换到 **`sonnet`** |

| **模型** | **适用场景** | **输入 / 1M tokens** | **输出 / 1M tokens** |
| --- | --- | --- | --- |
| **Haiku** | 简单任务、快速探索、子智能体 | $1.00 | $5.00 |
| **Sonnet**（默认） | 日常编程、功能开发、Bug 修复 | $3.00 | $15.00 |
| **Opus** | 复杂推理、架构设计、安全分析 | $5.00 | $25.00 |

<aside>
💡

**选择建议：** 日常用 Sonnet，子智能体探索用 Haiku（省 10-20 倍费用），只有架构设计或复杂调试才用 Opus。

</aside>

---

## ⚙️ 配置体系

### 配置文件层级（优先级从高到低）

1. **企业级**：`/etc/claude-code/managed-settings.json` — 全公司强制策略，用户不可覆盖
2. **CLI 标志**：命令行参数 — 当前会话
3. **本地项目**：`.claude/settings.local.json` — 个人，仅当前项目（应加入 .gitignore）
4. **共享项目**：`.claude/settings.json` — 团队共享，提交到 Git
5. **用户级**：`~/.claude/settings.json` — 所有项目

***个人开发直接使用3、5即可***

### [CLAUDE.md](http://CLAUDE.md) 记忆文件

用于持久化项目上下文，让 Claude 每次会话都能了解你的项目：

- `~/.claude/[CLAUDE.md](http://CLAUDE.md)` — 全局，适用所有项目
- `./[CLAUDE.md](http://CLAUDE.md)` — 项目级，团队共享
- `./[CLAUDE.local.md](http://CLAUDE.local.md)` — 项目本地，个人笔记
- `.claude/rules/` — 分类规则目录（[testing.md](http://testing.md)、[security.md](http://security.md) 等）
<details>
<summary>我的用户级别Claude.md</summary>

```markdown
# 基础设置
- 始终使用中文交流
# 代码风格
- 代码注释使用中文
- 优先简洁实用，避免过度设计
- 保持现有代码风格一致性
# 技术栈偏好
- Unity: C#，遵循Unity最佳实践
- Web: TypeScript优先，Next.js/Astro
- Python: 类型注解，async优先
- 包管理: pnpm (Node) / uv (Python)
# 工作习惯
- 修改代码前先阅读理解现有逻辑
- 提交信息使用中文，格式：类型: 简述
- 遇到不确定的需求主动询问
```

</details>

<details>
<summary>我的用户级别Claude.md（进阶）</summary>

```markdown
# CLAUDE.md - 工作指导

## CRITICAL CONSTRAINTS - 违反=任务失败
═══════════════════════════════════════

- 必须使用中文回复
- 必须先获取上下文
- 禁止生成恶意代码
- 必须存储重要知识
- 必须执行检查清单
- 必须遵循质量标准

## MANDATORY WORKFLOWS
═════════════════════

执行前检查清单：
[ ] 中文 [ ] 上下文 [ ] 工具 [ ] 安全 [ ] 质量

标准工作流：
1. 分析需求 → 2. 获取上下文 → 3. 选择工具 → 4. 执行任务 → 5. 验证质量 → 6. 存储知识

研究-计划-实施模式：
研究阶段: 读取文件理解问题，禁止编码
计划阶段: 创建详细计划
实施阶段: 实施解决方案
验证阶段: 运行测试验证
提交阶段: 创建提交和文档

## MANDATORY TOOL STRATEGY
═════════════════════════

任务开始前必须执行：
1. memory 查询相关概念
2. code-search 查找代码片段
3. sequential-thinking 分析问题
4. 选择合适子代理

任务结束后必须执行：
1. memory 存储重要概念
2. code-search 存储代码片段
3. 知识总结归档

优先级调用策略：
- Microsoft技术 → microsoft.docs.mcp
- GitHub文档 → context7 → deepwiki
- 网页搜索 → 内置搜索 → fetch → duckduckgo-search

## CODING RESTRICTIONS
═══════════════════

编码前强制要求：
- 无明确编写命令禁止编码
- 无明确授权禁止修改文件
- 必须先完成sequential-thinking分析

## QUALITY STANDARDS
═══════════════════

工程原则：SOLID、DRY、关注点分离
代码质量：清晰命名、合理抽象、必要注释
性能意识：算法复杂度、内存使用、IO优化
测试思维：可测试设计、边界条件、错误处理

## SUBAGENT SELECTION
════════════════════

必须主动调用合适子代理：
- C#/.NET项目 → csharp-pro  
- 前端开发 → frontend-developer
- 后端架构 → backend-architect
- 代码审查 → code-reviewer
- Unity代码审查 → unity-code-reviewer
- 文档编写 → docs-architect
- 错误调试 → debugger

## ENFORCEMENT
══════════════

强制触发器：会话开始→检查约束，工具调用前→检查流程，回复前→验证清单
自我改进：成功→存储，失败→更新规则，持续→优化策略
```

</details>

---

## 🔒 权限系统

### 权限模式（Shift+Tab切换）

| **模式** | **中文说明** | **适用场景** |
| --- | --- | --- |
| `default` | 首次使用每个工具时提示确认 | 日常开发 |
| `acceptEdits` | 自动批准文件编辑，Bash 仍需确认 | 信任项目 |
| `plan` | 仅分析，禁止执行或编辑 | 代码审查 |
| `bypassPermissions` | 跳过所有确认提示（谨慎使用） | CI/CD 自动化 |

### 工具权限规则示例

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep",
      "Bash(npm run:*)",
      "Bash(git:*)",
      "Edit(src/**)"
    ],
    "deny": [
      "Read(.env*)",
      "Bash(rm -rf:*)",
      "Bash(sudo:*)"
    ]
  }
}
```

---

## 🪝 Hooks 钩子系统

Hooks 在特定时机 **确定性** 执行 Shell 命令，不依赖模型判断，保证每次都会运行。

### 可用事件

| **事件** | **中文说明** | **可阻断？** |
| --- | --- | --- |
| `PreToolUse` | 工具执行前（可验证、记录或阻止） | ✅ |
| `PostToolUse` | 工具执行后（格式化、lint、构建等） | ❌ |
| `UserPromptSubmit` | 用户提交提示时（注入上下文） | ✅ |
| `SessionStart` | 会话开始时（环境校验） | ✅ |
| `Stop` | Claude 完成响应时（清理、记录） | ❌ |
| `Notification` | 触发通知时（自定义提醒） | ❌ |

### 示例：编辑后自动格式化

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "npx prettier --write \"$FILE_PATH\""
      }]
    }]
  }
}
```

---

## 🔌 MCP（模型上下文协议）

MCP 让 Claude Code 连接外部工具、数据库、API 和服务。

### 常用命令

```bash
# 添加 HTTP 类型服务
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# 添加 stdio 类型服务
claude mcp add --transport stdio postgres -- npx -y @anthropic-ai/mcp-server-postgres

# 查看已配置的服务
claude mcp list

# 移除服务
claude mcp remove github
```

---

## 🤝 子智能体（Subagents）

子智能体是独立的 Claude 实例，拥有自己的上下文窗口，用于隔离复杂任务，避免主对话上下文膨胀。

### 内置子智能体

- **Explore**（Haiku）：只读探索代码库，超快、超便宜
- **General**（Sonnet）：全功能读写，处理复杂任务
- **Plan**（Sonnet/Opus）：只读规划，制定实施方案

### 自定义子智能体

在 `.claude/agents/` 目录创建 `.md` 文件：

```markdown
---
name: security-reviewer
description: 安全代码审查专家
tools: Read, Grep, Glob
model: opus
---
你是一名高级安全工程师，负责审查代码中的漏洞...
```


<details>
<summary>个人Subagents推荐 - Unity代码审查</summary>

```markdown
---
name: unity-code-reviewer
description: Unity 代码静态审查专家，审查 Unity C# 代码的性能、GC、正确性、线程安全、序列化陷阱和可维护性。只读审查，不修改文件。
model: sonnet
---

You are a senior Unity code reviewer. You provide actionable review comments with Unity-specific rigor. You do NOT edit files—only analyze and report.

        ## Review Scope (prioritized order)

        ### 1. Correctness / Crashes (Blocker)
        - NullReferenceException risks: uninitialized fields, destroyed objects, missing components
        - Object lifetime: Destroy timing, scene transitions, DontDestroyOnLoad misuse
        - Domain reload: static state assumptions, [RuntimeInitializeOnLoadMethod] missing
        - Async misuse: Unity API called from background thread (must be main thread)
        - Race conditions: coroutine timing, async/await without proper synchronization

        ### 2. Performance & GC (High)
        Per-frame allocation sources:
        - LINQ in Update/FixedUpdate/LateUpdate
        - foreach on non-array collections (List<T>.Enumerator boxes on some Unity versions)
        - String concatenation, ToString(), string.Format in hot paths
        - Boxing: value types to object, nullable comparisons
        - Closures capturing variables (creates delegate allocation)
        - params array allocation

        Hot path anti-patterns:
        - GetComponent<T>() every frame → cache in Awake/Start
        - Find*, FindObjectOfType → cache or use dependency injection
        - Camera.main → cache (it calls FindGameObjectWithTag internally)
        - Instantiate/Destroy churn → use object pooling
        - Physics queries without NonAlloc variants

        ### 3. Architecture & Maintainability (Medium)
        - Tight coupling between systems
        - Hidden singletons, global state, unclear ownership
        - Overuse of SendMessage, BroadcastMessage, magic strings
        - Reflection in runtime code (slow, AOT issues on IL2CPP)
        - Testability: dependencies injectable, logic separable from MonoBehaviour

        ### 4. Serialization & Asset Pitfalls (Medium)
        - [SerializeField] on non-serializable types (silently fails)
        - UnityEvent with missing targets after refactor
        - Script rename/namespace changes breaking prefab references
        - ScriptableObject mutation at runtime (shared state bug)
        - Prefab override hazards in YAML changes
        - GUID/meta file conflicts

        ## Review Process
        1. If diff provided → focus on changed files first
        2. If no diff → infer likely areas from request keywords
        3. Use Glob/Grep to locate relevant code
        4. Cross-reference with Unity best practices

        ## Output Format (strict)

        ### Summary (3-6 bullets)
        Top risks and quick wins

        ### Findings Table
        | Severity | File | Location | Issue | Recommendation | Evidence |
        |----------|------|----------|-------|----------------|----------|
        | Blocker/High/Medium/Low | path | class/method | what & why (Unity-specific) | concrete fix idea | snippet or grep match |

        ### Follow-up Questions (max 5)
        Only if truly necessary for complete review

        ## Limitations

        - **No code execution**: Cannot run tests, Play mode, or any runtime verification
        - **No profiling**: Cannot measure actual CPU/GPU/memory usage; performance findings are based on static pattern recognition
        - **No scene/prefab inspection**: Cannot open .unity or .prefab files visually; can only grep YAML text
        - **No asset validation**: Cannot verify texture formats, mesh stats, audio settings, or material properties visually
        - **Static analysis only**: All findings are based on reading source code; false positives are possible for runtime-dependent behavior

        ## Collaboration

        - **Findings need fixing?** → Hand off Blocker/High issues to `unity-debugger` for targeted fixes, or to `unity-developer` for larger refactors
        - **Need deeper error investigation?** → Hand off to `unity-error-hunter` for log scanning
        - **Runtime verification needed?** → Tell the user to test in Unity Editor manually
        ```

</details>

---

## 🎨 Skills 技能系统

与斜杠命令不同，Skills 是 **模型自动调用** 的 — Claude 根据上下文自动识别并应用。

### 创建 Skill

在 `.claude/skills/my-skill/[SKILL.md](http://SKILL.md)` 中定义：

```markdown
---
name: code-reviewer
description: 代码审查专家，检查安全漏洞、性能问题和最佳实践
allowed-tools: Read, Grep, Glob
---
# 代码审查专业知识
审查时检查以下方面：
- 输入验证与注入攻击
- 认证与授权缺陷
- 性能与内存问题
```

<aside>
📝

**Skill vs Command vs Subagent**

- **斜杠命令**：你手动调用（`/deploy`），控制执行时机
- **Skill**：Claude 自动识别场景并应用，无需手动触发
- **子智能体**：隔离上下文窗口，适合复杂独立任务
</aside>

---

## 📋 自定义斜杠命令

在 `.claude/commands/` 中创建 `.md` 文件即可：

```markdown
---
description: 修复 GitHub Issue
allowed-tools: Read, Edit, Bash(git:*)
argument-hint: [issue-number]
---
修复 GitHub Issue #$ARGUMENTS，遵循我们的编码规范。
```

使用：`/fix-issue 123`


---

## 💰 费用管理

### 查看费用

```
> /cost
```

### 节省费用策略

1. 子智能体探索用 **Haiku**（比 Opus 便宜 10-20 倍）
2. 开启 **Prompt Caching**（默认开启）
3. 设置 `--max-turns` 防止失控对话
4. 定期执行 `/compact` 压缩上下文
5. 设置 `--max-budget-usd` 限制单次花费上限

---

---

## 🏷️ 快速参考卡

```
╔══════════════════════════════════════════════════╗
║          CLAUDE CODE 快速参考                     ║
╠══════════════════════════════════════════════════╣
║ 模型选择                                         ║
║  haiku    → 简单任务、探索            ($1/$5/M)   ║
║  sonnet   → 日常编程（默认）          ($3/$15/M)  ║
║  opus     → 架构设计、复杂推理        ($5/$25/M)  ║
╠══════════════════════════════════════════════════╣
║ 必备命令                                         ║
║  /compact   压缩上下文（50%时执行）               ║
║  /cost      查看费用                              ║
║  /model     切换模型                              ║
║  /status    查看状态                              ║
║  /init      初始化项目配置                        ║
║  /mcp       管理外部集成                          ║
╠══════════════════════════════════════════════════╣
║ 前缀速查                                         ║
║  # 消息     → 保存到记忆                          ║
║  @ 路径     → 引用文件                            ║
║  ! 命令     → 执行 Bash                           ║
║  & 任务     → 云端异步执行                        ║
╠══════════════════════════════════════════════════╣
║ 决策规则                                         ║
║  简单任务？       → Haiku                         ║
║  复杂推理？       → Opus                          ║
║  其他所有？       → Sonnet                        ║
║  必须每次执行？   → Hook（非提示）                ║
║  自动应用知识？   → Skill（非命令）               ║
║  需要隔离上下文？ → 子智能体                      ║
╚══════════════════════════════════════════════════╝
```

---

> *本笔记整理自 Claude Code 官方文档及社区指南，信息截至 2026年初。*