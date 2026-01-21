---
title: 关于在OpenWebUI中处理Base64返回的图片
published: 2025-10-01T17:59:24
updated: 2026-01-22T01:17:07
description: 'OpenWebUI 处理 Base64 图片的函数插件安装与配置教程。解决 AI 绘图模型返回 Base64 编码而非图片链接的问题，支持自定义 API 地址、密钥、模型 ID 和计费参数设置。'
image: '/images/openwebui-base-image.webp'
tags: [OpenWebUI, AI绘画, Base64]

draft: false 
lang: ''
---

::github{repo="Besty0728/OpenWebUI-Base64-Image"}

# 关于在OpenWebUI中处理Base64返回的图片
## 1.打开OpenWebUI的函数界面直接选择从新连接链接
```bash
https://github.com/Besty0728/OpenWebUI-Base64-Image/blob/main/image_decoder_pipe.py
```
## 2.安装完成后填写对应的参数
- API基础URL：自定义请求模型供应商地址
- API Key：自定义请求模型供应商的Key
- 模型ID：自定义请求模型供应商的模型名称
- 每次生成费用（元）：自定义请求模型供应商单次生成费用（可配合计费插件使用）
- 请求超时时间（秒）：自定义请求模型供应商的请求超时时间（等待图片）

完成后效果如下
![](/images/baseimage1.webp)
---
![](/images/baseimage2.webp)