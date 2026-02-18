---
title: GeminiCLI账号切换插件，让你的开发之路不在繁琐！
published: 2025-12-21T22:00:16
updated: 2026-02-18T12:05:48
description: '最近Unity项目开始庞大了，单一的网页交互式AI开发效率远不如编译器内AI，但是我都没拿到钱也不想使用CluadeCode;诶,送了我n个学生Pro的Google大善人又发力了！'
image: '/images/geminicli1.webp'
tags: [Gemini,GeminiCLI]

draft: false 
lang: ''
---
# 项目地址
::github{repo="Besty0728/Gemini-CLI-Auth-Manager"}

# 为什么突然想要使用GeminiCLI以及要编写这个插件呢？
- 项目仍未带给我个人实际收益，不值得使用付费的ClaudeCode
- 项目内容越来越大，单一Web对话式AI已经很难在有限上下文下保持高开发效率了，不如使用“嵌入”式AI
- Google大善人给了我n个AI Pro账号，在工作室电脑犯病登不上Antigravity的情况下，GeminiCLI同样对AI Pro用户有更高的额度供我使用

# 那为什么突然想到要开发这个插件呢？

## 1.Unity开发整体消耗较大
- 昨天一下午与Gemini共同燃烧了一下午修复遗留的奇妙BUG，结束后看到了消耗的Token高达百万，以及请求次数也很多（包括整体的第一次项目初始化）让我不得不担心一个账号的额度是否足够我一个人一天的开发

## 2.账号切换麻烦
- 账号的默认切换方式只有/auth然后再选择登录其他账号，不保证哪次登录又需要验证码了；很浪费时间

# 最后使用效果
- 如图所示，切换丝滑
![GeminiCLI账号切换效果](/images/geminicli2.webp)