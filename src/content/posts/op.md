---
title: 记一次EX5700的刷机过程
published: 2025-07-28
description: 合勤EX5700路由器的刷机教程
tags: [OpenWRT , Router]
category: Technique
draft: false
---
### 前情提要

去年年底的时候看见这个机器，感觉很有意思，机器的开发似乎只进行到了ES阶段，有2.5G口，1G DDR4配合MT7986，关了无线简直是个完美的弱电箱拨号机。近期回到国外了，这台机器也算结束了它的使命，被我带出来当玩具了。想起来之前翻新过一篇AX6的刷机教程，不如也记录一下这台机器的刷机教程好了。

~~然后就被各种各样的乱七八糟的事情拖到了现在。~~

结果找到这篇写了一半的文章发备份之后又快过去一年了，令人感叹。

## 说明

本篇文章适用于合勤EX5700，由于本文撰写时机器并不在手边，且机器很早之前就已经刷完了，所以下面有很多图目前是缺失的，且有些语句可能并不严谨，目前的教程需要您有足够的玩机经验，才能尽可能避免出错。如果您没有多少经验，可以先收藏一下等作者这几天完善一下再来。

~~不过都来买这机器了也不至于没玩过几台机器吧）~~

考虑到本文大多数操作都在断网环境下进行所以你可以在这里下载到刷机所需的所有文件。

::github{repo="Kazusa1085/ZyXEL_AXE7800-OpenWRT"}

当然如果你嫌麻烦的话，也可以根据自己的网络环境自行点击下面的链接下载。由于本人不在国内，没有百度盘账号，如果您的网络环境无法访问Github，且不会寻找Github在您对应网络环境下的加速手段，请去下面列出的恩山的这几个帖子下载。

[固件下载](https://www.right.com.cn/forum/forum.php?mod=viewthread&tid=8402801&highlight=ex5700) [Uboot下载](https://www.right.com.cn/forum/forum.php?mod=viewthread&tid=8391209) [无线校准文件下载](https://www.right.com.cn/forum/forum.php?mod=viewthread&tid=8401722)

如果您可以使用Github，也可以选择在这里下载。

[固件下载（Github Release）](https://github.com/Kazusa1085/ZyXEL_AXE7800-OpenWRT/releases/tag/2025.07.28-0348) [Uboot下载](https://github.com/Kazusa1085/ZyXEL_AXE7800-OpenWRT/raw/refs/heads/main/Files/Uboot/mt7986_zyxel_ex5700-fip-fixed-parts.bin) [无线校准文件下载](https://github.com/Kazusa1085/ZyXEL_AXE7800-OpenWRT/raw/refs/heads/main/Files/EEPROM/8015eeprom.bin)

:::warning[例行警告]
路由器刷机存在一定的风险，虽然讲真，自带固件真没什么好备份的，但是还是推荐有条件的话尽可能进行一下分区备份，免得翻车之后完全没有后路。
:::

## 准备

### 硬件

- 一台能用的合勤EX5700（下称路由器）
- 一个TTL串口模块（下称模块）
- 一台支持网线连接的电脑（下称电脑）

### 软件

- 类似Putty/XShell等串口通信软件
- Chrome或Edge浏览器
- tftp32或你的串口软件支持Kermit/X&Y-Modem等Uboot支持的文件传输方案

------

## 刷机步骤

这台机器的刷机步骤相比于小米非常简单，您只需要按照以下步骤即可刷入固件。

### 刷Uboot

连接模块和路由器，路由器的TTL排针位于路由器右下角，定义如图所示：

![TTL Pin Desp](https://picx.raana.icu/IMG_20250728_040823.83acewnxvs.webp)

:::caution[警告]
**不要连接你的模块上的3V3和路由器上的3V3引脚！可能会烧毁您的模块或路由器！**
**不要连接你的模块上的3V3和路由器上的3V3引脚！可能会烧毁您的模块或路由器！**
**不要连接你的模块上的3V3和路由器上的3V3引脚！可能会烧毁您的模块或路由器！**
:::

:::note[注意]
在连接您的TTL模块与路由器时，需要注意您模块上的Tx引脚应连接到路由器的Rx引脚，Rx引脚应连接到路由器的Tx引脚，且模块与路由器共地（连接模块的GND与路由器的GND引脚)。这样您的模块才能与路由器正常通信。
:::

连接后打开您的串口通信软件，使用波特率115200连接串口。

在串口回显Hit any key to stop autoboot的时候按下键盘上的任意键中断Uboot，当然您也可以确保串口软件在前台的时候先开始连续拍空格，然后再给路由器上电，到中断的时候自然会中断。

网卡配置静态ip后，使用tftp32上传Uboot文件

```shell
tftpboot mt7986_zyxel_ex5700-fip-fixed-parts.bin
nmbm nmbm0 erase 0x380000 0x200000
nmbm nmbm0 write 0x41e00000 0x380000 0x200000
```

你也可以等mtkautoboot时，菜单直接选择Update FIP，然后在下面选择一种你喜欢的方案更新。

写入完成后会自动重启，如果你的机器没自动重启，请自行倒数五个数后关闭电源再次上电。

不需要修改网卡设置，你可以选择长按Reset键进入Uboot，也可以选择在mtkautoboot阶段的启动菜单里直接选择Start Uboot Websafe。

Uboot界面暂时参考AX6 Uboot的使用方法，都一样。

选择你下载的固件刷入即可。

### 刷eeprom（可选）

如果你的机器刷机后遇到了无线Mac丢失，循环重启等问题，可以执行此步骤。

启动时中断Uboot，或者菜单选择进入Uboot控制台

```shell
tftpboot 8015eeprom.bin
nmbm nmbm0 erase 0x180000 0x200000
nmbm nmbm0 write 0x46000000 0x180000 0x200000
reset
```

机器reset后应该会看到Mac地址变成了校准文件里的，且能观测到问题缓解。

## 其他资料

这个机器是可以扩2G DDR4 RAM的，睡前花了一点时间随手换了一个，没想到居然成了。

颗粒型号是K4AAG165WA-BCWE，理论上MT7986的路由器只要能焊上这玩意都能上2G DDR4（条件是地址线完整）。

改DRAM量力而行，没有金刚钻别揽瓷器活，玩坏了自己挂🐟哈。

![2GDDR4](https://picx.raana.icu/IMG_20250801_055149.4n80sn3taw.webp)

/*2025.8.1 06:10 GMT+8 Update*/

LED的定义和天线对应频段，暂时没体力写下去了，先这样吧。

## Q/A

**Q：什么时候继续更新？**

A：会在几天内把这篇教程写完的。笔者在写下这篇文章的时候刚刚修改完论文，精神状态非常良好。大脑暂时无法组织起具有逻辑性发文本了。~~肥猫又不是鸽子~~




/*Author: Kazusa1085*/

/*Update at 2025.07.02, 04:56 GMT+8*/
