---
title: 关于如何在OpenWebUI中启用OpenAI的responses端点的模型
published: 2025-09-21T17:50:42
updated: 2026-01-22T01:17:07
description: '最近发现OpenWebUI尚未支持OpenAI的新responses端点模型，（Cloudflare提供的OSS模型以及官方O系列模型）社区解决方案如下，但不能完美解决，故自己写了一个更好的解决方案'
image: '/images/cloudflare-color.webp'
tags: [OpenWebUI, OpenAI, Cloudflare, API端点兼容]

draft: false 
lang: ''
---


::github{repo="Besty0728/OpenWebUI-Cloudflare-OSS"}

## 关于如何在OpenWebUI中启用官方OpenAI的responses端点的模型
### 1.官方端点我们采用了社区关于responses端点的解决方案（实测正常使用官方端点）
[社区解决方案链接](https://github.com/jrkropp/open-webui-developer-toolkit/tree/main/functions/pipes/openai_responses_manifold)
先按照社区文档的步骤进行操作，安装这个Pipe；安装链接如下
```bash
https://github.com/jrkropp/open-webui-developer-toolkit/blob/main/functions/pipes/openai_responses_manifold/openai_responses_manifold.py
```
安装后需要我们对此Pipe进行一些修改，主要是修改你要请求的端点以及模型等
![OpenWebUI Pipe管理配置界面](/images/OPRmanager.webp)
## 2.调用Cloudflare的OSS模型，采用我的Pipe
[Cloudflare OSS模型调用文档](https://developers.cloudflare.com/changelog/2025-08-05-openai-open-models/)
### 1.首先你需要去Cloudflare注册一个账号，然后创建一个API Token、获得你的账户ID，获得方法如图
- 账户ID获得方法
![Cloudflare账户ID获取位置截图](/images/CFAI1.webp)

- 创建API Token，选择后续的WorkerAI模板即可
![Cloudflare API Token创建步骤截图](/images/CFAI2.webp)

创建完成后你会获得一个API Token，复制保存好
### 2.然后我们安装我开发的Pipe

::github{repo="Besty0728/OpenWebUI-Cloudflare-OSS"}

#### 安装链接
```bash
https://github.com/Besty0728/OpenWebUI-Cloudflare-OSS/blob/main/cloudflare_responses.py
```
- Cloudflare Account ID处填写你刚才获得的账户ID
- API Key处填写你刚才创建的API Token

- 模型名称处填写你要调用的模型名称，例如本次的`@cf/openai/gpt-oss-120b`，如果你要调用其他模型请参考Cloudflare的文档（以上只适用于responses端点的模型）

**填入如图**
![OpenWebUI Cloudflare OSS Pipe配置填写示例](/images/OWCF.webp)
### 3.最后别忘了启用该Pipe，以及某些模型的特定修改
例如本文的Cloudflare的OSS模型需要我们在参数处选择禁用`Stream Chat Response`（流式对话响应/流式输出；因为CF不支持流式输出调用该模型；也可以选择不修改，因为我的Pipe禁用了）
![OpenWebUI模型参数设置禁用流式输出](/images/OSSSetting.webp)

### 4.完成后即可愉快使用
实测支持OpenWebUI的联网工具等
![OpenWebUI使用Cloudflare OSS模型对话效果展示](/images/OP-OSS.webp)