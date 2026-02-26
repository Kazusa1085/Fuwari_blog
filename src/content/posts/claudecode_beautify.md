---
title: Claude Code 终端美化指南
published: 2026-02-26T23:02:54
description: '习惯了 IDE 的你，面对 Claude Code 原始的终端界面是否感到不适？本篇手把手教你从状态栏到字体全面美化 Claude Code，让命令行也能赏心悦目。'
image: '/images/ClaudeCodeBE4.webp'
tags: [ClaudeCode, 美化, 终端]

draft: false 
lang: ''
---

不少同学初次接触 Claude Code 时，多少会对纯命令行界面的"朴素"感到不适——毕竟大家日常都习惯了 IDE 的丰富界面。好消息是，只需要几步简单的配置，就能让你的 Claude Code 焕然一新。

# 1. 状态栏优化

默认的 Claude Code 终端没有任何额外的状态信息展示，看起来相当单调。这里推荐一个开箱即用的状态栏工具 **ccstatusline**：

::github{repo="sirmalloc/ccstatusline"}

## 美化前

原始状态下，Claude Code 的终端是这样的：

![Claude Code 原始界面](/images/ClaudeCodeBE1.webp)

## 美化后

添加状态栏后，立刻变得信息丰富且美观：

![Claude Code 状态栏美化效果](/images/ClaudeCodeBE2.webp)

## 安装与配置

> 前提条件：Windows 系统，已安装 Node.js

只需一条命令即可完成安装：

```bash
npx ccstatusline@latest
```

安装完成后会进入交互式配置界面，你可以根据个人喜好自由定制（也可参照官方文档进行更深度的自定义配置，包括安装 Powerline 字体等）：

![ccstatusline 配置界面](/images/ClaudeCodeBE3.webp)

以下是我个人的配置方案，供参考：

- **Edit Lines**
  - Line 1：保留 4 个默认组件（模型名称、上下文窗口、Git 分支、改动数量）
  - Line 3：添加 `Custom Text`（自定义文本：`Betsy-ClaudeCode`）+ `Session Clock`（会话计时器）
- **Powerline Setup**
  - 除 `Align Widgets` 外全部启用
  - `Separator`：*Triangle Right* | `Start Cap`：*Lower Triangle* | `End Cap`：*Triangle*
  - `Themes`：*Nord-aurora* 配色方案
- **Terminal Options**
  - `Color Level`：*Truecolor*（确保终端色彩还原度最佳）

配置完成后，可以在 Claude Code 的 `settings.json` 中确认是否生效：

```json
"statusLine": {
    "command": "ccstatusline",
    "type": "command"
}
```

# 2. 字体美化

一款优秀的等宽字体不仅能提升代码可读性，还能让终端整体观感大幅提升。这里个人强烈推荐 **Maple Mono NF CN** ——一款同时支持中英文的等宽编程字体，内置 Nerd Font 图标：

::github{repo="subframe7536/maple-font"}

## 方式一：让 Claude Code 帮你改（懒人推荐）

如果你的电脑已安装该字体，直接把下面这段话发给 Claude Code，让它帮你完成配置：

```text
现在帮我将终端字体显示改为 Maple Mono NF CN ，字体路径.....
```

## 方式二：手动修改 Windows Terminal 配置

找到 Windows Terminal 的配置文件：

```
C:\Users\<你的用户名>\AppData\Local\Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json
```

在 `profiles.defaults` 中添加字体配置：

```json
"defaults": {
    "font": {
        "face": "Maple Mono NF CN"
    }
}
```

## 方式三：IDE 内使用

如果你主要在 VS Code 等 IDE 中使用 Claude Code，直接在 IDE 的设置中修改IDE整体字体为 `Maple Mono NF CN` 即可。

# 3. 最终效果对比

经过状态栏 + 字体的双重美化，来看看前后对比：

**美化前：**

![Claude Code 美化前](/images/ClaudeCodeBE1.webp)

**美化后：**

![Claude Code 美化后](/images/ClaudeCodeBE4.webp)

是不是瞬间从"原始人终端"变成了"赛博朋克工作站"？赶紧动手试试吧！