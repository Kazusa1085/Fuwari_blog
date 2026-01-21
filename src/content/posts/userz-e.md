---
title: 如何修改Windows用户名
published: 2025-09-19T23:21:47
updated: 2026-01-22T01:17:07
description: 'Windows 中文用户名改英文名完整教程。通过启用 Administrator 超级用户账户，安全重命名用户文件夹并修改注册表 ProfileImagePath，解决软件兼容性问题，避免路径中文乱码。'
image: '/images/Users.webp'
tags: [Windows, Windows用户名修改]

draft: false 
lang: ''
---
## 1.首先你需要打开你的命令提示符（管理员权限），然后输入以下命令来开启超级用户去修改你的用户名：

![](/images/ML.webp)

```bash
net user administrator /active:yes
```
## 2.然后按下Alt+F4，选择切换用户，切换到管理员账户（Administrator）

## 3.在任务管理器（Ctrl+Shift+Esc）关闭之前的用户所有进程
![](/images/UserM.webp)

## 4.先重命名用户文件夹（C:\Users\原中文用户名）为（C:\Users\新英文用户名）
![](/images/Users.webp)

如果存在仍有进程在运行问题，则开启你的资源监视器（Ctrl+Shift+Esc下的性能页面右上角的“打开资源监视器”）
![](/images/ZYGL.webp)

然后在资源监视器的CPU页面的关联句柄搜索框中输入你的用户名，找到相关进程并结束它们<span style="color: red; font-weight: bold;">（需要重启则重启，后续仍选择超级管理员，误进入原来的用户导致错乱后果自负！！！）</span>
![](/images/ZYJ.webp)

## 5.然后打开注册表编辑器（Win+R，输入regedit回车），定位到以下路径：

```plaintext
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList\S-1-5-21-1144158939-3632170427-3967875196-1001（一般是第三个，选中有你用户名的即可）
```
修改<ins>**ProfileImagePath**</ins>
![](/images/eng11.webp)

## 6.更改完成注册表后，按下Alt+F4，选择切换用户，切换到你的新英文用户名即可
然后打开任务管理器（Ctrl+Shift+Esc）关闭管理员账户所有进程；再打开命令提示符（管理员权限），然后输入以下命令来关闭超级用户：

```bash
net user administrator /active:no
```

## 7.配置文件看的是你C盘根目录下的Users文件夹下的用户名文件夹，并非是设置里的用户名