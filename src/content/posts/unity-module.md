---
title: Unity自定义添加模块
published: 2025-12-02T20:08:07
updated: 2026-01-22T01:17:07
description: 'Unity Hub 无法添加模块的解决方案。通过 Unity 官方下载存档手动安装 Android、iOS 等平台模块，以及中文语言包和文档的正确安装路径配置，完美解决模块缺失问题。'
image: '/images/unitymod0.webp'
tags: [Unity,汉化,模块添加]

draft: false 
lang: ''
---
## UnityHub安装Unity时手动添加模块
有些情况下，我们即使使用了正确的安装量设置等，但UnityHub在安装Unity时，仍然会出现没有“添加模块”这个选项的情况，如下图所示：
![UnityHub缺少添加模块选项的问题截图](/images/unitymod0.webp)

这个时候我们可以通过以下步骤手动添加模块：
## 1.打开Unity下载页面，选择“下载存档”
![Unity官网下载存档页面入口](/images/unitymod1.webp)
## 2.在存档页面选择对应的Unity版本，选择下载的“See all”（即查看所有）
![Unity存档页面选择See all查看所有组件](/images/unitymod2.webp)
## 3.在对应版本页面，选择Componment installers（组件管理器）下的需要的模块进行下载
![Unity Component installers组件下载列表](/images/unitymod3.webp)
## 4.下载完成后，运行对应的模块安装程序，选择Unity的安装路径进行安装
例如我的安装路径为E:\UnityEditor\2022.3.62f2\Editor

Unity对应版本\Editor
![Unity模块安装程序选择安装路径](/images/unitymod4.webp)
## 5.安装中文模块与文档需要安装在Editor/Data下
文档解压到Editor/Data下即可；中文模块为Localization文件夹，解压到Editor/Data下即可（就是zh-hans.po），官方找不到就搜索下载
![Unity中文语言包安装路径说明](/images/unitymod4.webp)
![Unity Editor Data目录结构截图](/images/unitymod5.webp)
## 6.完成后重启Unity即可
如果出现问题，可以尝试重新安装模块，或者检查（）路径是否正确，以及手动下载（例如OpenJDK（安卓打包组件））
![Unity模块安装完成后的编辑器界面](/images/unitymod6.webp)
