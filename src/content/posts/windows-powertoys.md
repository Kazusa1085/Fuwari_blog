---
title: 还在嫌弃Windows难用？不妨来体验一下隐藏功能
published: 2026-04-19T16:54:54
description: 'Windows的默认设计有很多人都反馈难用，那是你默认用的都是残血Win，不妨使用PowerToys来解锁满血Windows，变得更加人性化'
image: '/images/pt-hero.light.webp'
tags: [Windows,系统提效]

draft: false 
lang: ''
---

# 1.你的Windows是否一样反人类？
起因是因为宿舍断电，我有时候要在黑暗环境里完成编写收尾，但是即使我亮度拉到最小，
平时舒适的白色也会非常刺眼，于是想切换到深色模式，结果一查资料，切换很是麻烦，
好在我们发现了官方提供的有用的工具，本篇的主角--**PowerToys**

# 2.PowerToys是什么？
PowerToys是微软官方出品的是一系列帮助你定制 Windows 和简化日常任务的工具，它提供了很多
我们期望的功能，来让我们的Windows变得更加人性化，是一个优秀的高级工具
## 项目地址
::github{repo="microsoft/PowerToys"}

同样你可以前往你的Microsoft应用商店里面去直接下载

<a style="text-decoration:none;display:inline-block;line-height:0;" href="https://aka.ms/getPowertoys">
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="/images/StoreBadge-dark.webp" width="240" />
    <img src="/images/StoreBadge-light.webp" width="240" alt="Get it from Microsoft Store" style="display:block;" />
  </picture>
</a>

再或者使用Winget

```powershell
winget install Microsoft.PowerToys -s winget
```

# 3.PowToys的推荐功能

## 1.光暗一键切换
本篇文章初始最想解决的痛点，一键切换（启动PowerToys的前提下，所以我们建议设置为开机自启）

![光暗模式](/images/potyslightswitch.webp)

## 2.快速浏览文件
类似于MacOS中的空格按下查看文件，之前我是使用QuickLook这个软件来实现的这种功能

![快速浏览](/images/potyspeek.webp)

## 3.固定置顶窗口
这个非常利好于我们避免聚焦的软件切换而遮挡想要获取的信息，传统的分屏会让软件比例拉伸，不利于观感

![置顶窗口](/images/potyspintop.webp)

## 4.鼠标快速寻找
平时在大比例显示器中会出现找不到自己的鼠标去哪里了，我们还要费时间去寻找它，这个功能帮我们快速寻找到鼠标

![寻找鼠标](/images/potysfindcursor.webp)

## 5.自定义布局
这个可以让你自定义设定好你喜欢的应用比例布局，相对实用

![布局设置](/images/potyslayout1.webp)
![定义布局](/images/potyslayout2.webp)

## 6.颜色提取器
这个可以让你方便的提取任何地方的色彩信息，不用打开图像工具或寻找源码等，支持多种格式

![提取颜色](/images/potyscolor.webp)

## 7.文本提取器
这个其实就是底层的OCR技术，将支持的文字直接复制到你的剪贴板里，还是可以的

![提取文字](/images/potystext.webp)