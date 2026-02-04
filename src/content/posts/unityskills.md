---
title: Unity Skills - 让AI直接操控Unity编辑器
published: 2026-02-04T22:47:30
description: '一套让AI直接操控Unity的自动化方案：270+技能、批处理、事务回滚，兼容Antigravity/Claude Code/Gemini CLI等主流终端。'
image: '/images/unityskills-cover.webp'
tags: [Unity, AI, UnitySkills, Skill]

draft: false 
lang: ''
---
# 项目地址
::github{repo="Besty0728/Unity-Skills"}

# 为什么做这个？

- Unity场景结构复杂，向AI描述时词不达意
- 重复性操作太多：创建GameObject、配置组件、调整参数...
- Unity MCP理念不错，但缺少批处理、事务回滚等特性
- 日常使用多个AI工具，需要统一的自动化方案

# 核心特性

## Token优化
- **Result Truncation**：自动精简返回结果
- **精简的SKILL.md**：减少上下文占用
- 相比于MCP实测消耗约降低40%

![Result Truncation效果](/images/unityskills2.webp)

## 270+工具集
- 覆盖GameObject、组件、场景、资源等常用操作
- **Batch批处理**：单次请求完成多个操作
- 搭建场景结构从多次调用变为一次请求

![Batch操作示例](/images/unityskills3.webp)

## 事务回滚
- 操作失败自动回滚，避免残留半成品对象
- 保持场景状态一致性

![事务回滚机制](/images/unityskills4.webp)

## 多实例管理
- 自动端口发现（8090-8100）
- 全局注册表，支持同时操控多个Unity项目

![多实例支持](/images/unityskills5.webp)

## AI终端兼容

| AI终端 | 集成方式 |
|--------|----------|
| Antigravity | `/unity-skills`斜杠命令、workflow |
| Claude Code | 自动意图识别 |
| Gemini CLI | experimental.skills规范，自动使用 |
| Codex | $skill显隐式均调用 |

# 安装

## 1. 安装Unity插件
通过Package Manager添加Git URL：
```
https://github.com/Besty0728/Unity-Skills.git?path=/SkillsForUnity
```

## 2. 启动服务
`Window > UnitySkills > Start Server`

## 3. 配置AI Skills
1. 打开 `Window > UnitySkills > Skill Installer`
2. 选择AI终端，点击 **Install**

自动生成：
- `SKILL.md` - 技能说明
- `scripts/unity_skills.py` - Python客户端
- Antigravity额外生成`workflows/unity-skills.md`

# 使用示例

**场景搭建**：描述"创建一个包含Player、敌人生成器和相机控制器的基础场景"，AI完成具体操作。

**批量操作**：给场景中所有敌人添加血条UI，批处理一次完成。

# 后续计划

- 扩充技能库
- 持续优化性能

---

**技术栈**: Unity 2021.3+ | C# | Python | REST API  
**许可证**: MIT  
**作者**: Besty0728
