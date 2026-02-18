---
title: 解决Cloudflare搭建的图床跨域问题
published: 2025-10-12T18:31:33
updated: 2026-02-18T12:05:48
description: '我博客的随机图是采用了搭建于Cloudflare的Cloudflare-Imgbed图床,但是由于安全策略,导致跨域问题,本文介绍了如何解决这个问题.'
image: '/images/errimgbed.webp'
tags: [Cloudflare, 图床, CORS]

draft: false 
lang: ''
---
# 1. 问题描述
最近在观察博客的控制台时发现有跨域问题,如下图所示:
![图床跨域错误截图](/images/errimgbed.webp)

# 2. 问题解决方法
对于这个我们只需要前往Cloudflare的控制面板,修改我们的规则即可
## 修改响应标头转换规则（Response Header Transform Rules）
前往Cloudflare的控制面板,选择你的域名,然后选择"规则"->"概述"->"响应标头转换规则",如下图所示:
![Cloudflare响应标头转换规则入口](/images/imgbedrule1.webp)
然后如图依次添加以下标头以及其对应值，以及主机名=你的图床域名
> [!NOTE]
> - Access-Control-Allow-Headers - *
> - Access-Control-Allow-MethodsAccess-Control-Allow-Methods - GET, HEAD, OPTIONS
> - Access-Control-Allow-Origin - *

![Cloudflare标头配置示例](/images/imgbedrule2.webp)