---
title: 记一次红米AX6的解锁刷机扩容过程。
published: 2022-09-17
description: 红米AX6的刷OpenWRT的教程
image: https://blog.raana.icu/picx-images-hosting/20250702/IMG_20250702_065651.5xaws54qkr.webp
tags: [OpenWRT , Router]
category: Technique
draft: false
---
### 前情提要

月初搬家了，为了保证网络设备最高控制权掌握在自己手里，于是在新房子拉了两条宽带，自己加钱独占一条，两个舍友合租一条。但是因为分家的时候，原来的AX3000分给了我的舍友，自己只剩一个远古时代的AC2100勉强使用。然而MT7621确实已经老了，再加上机器本身因硬件问题并不稳定，半小时一掉线两小时一重启，最后忍无可忍上了这台AX6，以RA69之名62块钱（含邮费）到手，但是原装固件懂得都懂，于是有了这篇文章。

这篇文章翻新的时候已经距离写出这篇文章两年了，这台机器早就送人了。考虑到这机器现在🐟上的价格已经降到当初我的捡漏价了，还是打算翻新一下，万一有人还在玩这个机器呢。

## 说明

本篇文章适用于红米AX6，以及后出的小米AX3000/AX6000机型。对于猴米新AX3000产品，推荐立即退货，估计后续真不想买小米的路由器了。

~~小米万兆路由器真香嘿嘿嘿~~

因大多数步骤在自己折腾的时候并没有截图记录，事后才想起来“我要不要写一篇教程方便一下后来人”，所以本文图基本都源网络，侵删。

考虑到本文大多数操作都在断网环境下进行所以你可以在这里下载到下面除了Uboot外的所有文件。Uboot请自备，或按照文中内容获得。

::github{repo="Kazusa1085/Redmi-AX6_OpFiles"}

:::note[注意]
本文中使用的Uboot相关文件需要向原作者购买以获得，且没有Uboot相关文件本教程将会无法执行扩容刷机那一步，笔者并未尝试过提供的文件是否可以在不扩大分区的情况下刷入，请对自己的设备负责。原作者在翻新这篇文章的时候标价是5块钱，如果您需要扩容刷机且介意的话现在就可以关闭网页了，免得刷一半发现需要购买退无可退。
:::

:::warning[警告]
**本文采取的方式将会使你刷回官方固件的难度大大增加！如果您有条件，建议您先对路由器使用编程器进行备份以增加容错率！**执行过程中请若未提到**请尽量采用有线方式连接你的AX6**！否则可能出现包括但不限于**路由器变砖**，心态爆炸，键盘，鼠标等外设被砸坏，血压升高，眼前一黑等症状。为了您的健康和您的路由器正常工作，**请不要采取任何冒险的操作！除非你知道你在做什么并且准备为此承担其可能的后果！**
:::

## 准备

- 一台搭载了 OpenWrt 系统的无线路由器（下称辅助路由器）
- 红米 AX6（Redmi RA69）
- 一台支持网线连接的电脑（下称电脑）

------

## 解锁SSH

登入 AX6 后台，检查固件版本。

推荐的版本号为：MiWiFi 稳定版 1.0.16（[点此下载](https://raw.githubusercontent.com/Kazusa1085/Redmi-AX6_OpFiles/main/miwifi_ra69_firmware_a7244_1.0.16.bin)），本教程仅保证在该版本下有效，若版本号不匹配，请先升级 / 降级固件。

首先将将电脑与辅助路由器通过有线连接，并通过ssh连接辅助路由器。

假设辅助路由器地址为 192.168.1.1，则连接的命令通常看起来是这样的：

```shell
ssh root@192.168.1.1
```

成功连接辅助路由器后，你需要逐条执行下面的命令：

:::warning[警告]
**执行本脚本会更改您的网络和无线设定，执行之前请务必备份相关数据**
:::

```shell
cd /tmp
curl -sSL https://raw.githubusercontent.com/Kazusa1085/Redmi-AX6_OpFiles/main/wireless.sh | bash
```

当然你也可以在[这里](https://raw.githubusercontent.com/Kazusa1085/Redmi-AX6_OpFiles/main/wireless.sh)下载wireless.sh，然后使用WinSCP将wireless.sh上传到辅助路由器的root目录下，然后通过 SSH 连接，执行下面的命令（按回车确认）。这两种二选一就可以，笔者用的是下载并上传的方案。

```shell
sh /root/wireless.sh
```

[![返回结果](https://user-images.githubusercontent.com/22235437/171395788-1281eae4-6457-47ad-8796-4fcf389130ea.png#vwid=922&vhei=513)](https://user-images.githubusercontent.com/22235437/171395788-1281eae4-6457-47ad-8796-4fcf389130ea.png#vwid=922&vhei=513)

将电脑与辅助路由器的有线连接断开，连接到你的AX6上。

登入路由器后台，获取 STOK（`http://192.168.31.1/cgi-bin/luci/;stok=xxx` 其中的 `xxx` 即为 STOK）

然后访问下面的 URL（STOK，ssid和pwd替换后均不含尖括号）：

```URL
http://192.168.31.1/cgi-bin/luci/;stok=<stok>/api/xqsystem/extendwifi_connect_inited_router?ssid=<ssid>&password=<pwd>&admin_username=root&admin_password=admin&admin_nonce=xxx
```

其中 `<stok>`为上一步获得到stok值， `<ssid>`为辅助路由器的wifi名，`<pwd>`为辅助路由器的wifi密码 ，请根据实际情况填写。

等待一会，当浏览器显示如图所示的 code 0 则表示 破解SSH成功， root密码查看5GHz频段WiFi密码即可得到。

![图例](http://supes.top/wp-content/uploads/2022/05/6-scaled.jpg#vwid=2560&vhei=934)

**SSH解锁后不要重启！重启就白解锁了！**

## 扩容刷机

解锁ssh后，如果我们想刷入OpenWRT固件，那么可以选择不扩容，将A/B分区其中一个刷为OpenWRT，或者合并mtd13和mtd14（RootFS_1和OverLay）以获得60MB的空间写入固件，或者采取本文所记载的方式，合并mtd12（RootFS），mtd13（RootFS_1），mtd14（OverLay），以获取100+MB的空间写入固件。

**下文提到的“路由器”均为你的AX6，辅助路由器解锁完成SSH之后就完成了它的使命了，可以丢在一边了。**

使用ssh连接你的路由器，逐一执行如下命令：

```shell
nvram set flag_last_success=0
nvram set flag_boot_rootfs=0
nvram set flag_boot_success=1
nvram set flag_try_sys1_failed=0
nvram set flag_try_sys2_failed=0
nvram set boot_wait=on
nvram set uart_en=1
nvram set telnet_en=1
nvram set ssh_en=1
nvram commit
```

使用WinSCP将QSDK底包上传到/tmp目录。

底包下载地址 : [openwrt-redmi_ax6-squashfs-nand-factory.ubi](https://raw.githubusercontent.com/Kazusa1085/Redmi-AX6_OpFiles/main/openwrt-redmi_ax6-squashfs-nand-factory.ubi)

然后执行以下命令：

```shell
ubiformat /dev/mtd12 -y -f /tmp/openwrt-redmi_ax6-squashfs-nand-factory.ubi
nvram set flag_last_success=0
nvram set flag_boot_rootfs=0
nvram commit
reboot
```

若在执行ubiformat命令时，出现 “please, first detach mtd12 (/dev/mtd12) from ubi0”，则将mtd12改成mtd13，后面命令里的0改为1。

修改完成的命令如下：

```shell
ubiformat /dev/mtd13 -y -f /tmp/openwrt-redmi_ax6-squashfs-nand-factory.ubi
nvram set flag_last_success=1
nvram set flag_boot_rootfs=1
nvram commit
reboot
```

等待AX6重启后浏览器输入 10.0.0.1 即可进入openwrt底包后台（用户名密码均为root）。

使用WinSCP登录路由器，将ax6-uboot.bin 和 ax6-uboot-mibib.bin 上传至 /tmp 目录。

这两个文件可以在[这里](https://mbd.pub/o/bread/mbd-ZZuTlJpu)获得

执行以下命令：

```shell
mtd erase /dev/mtd1
mtd write /tmp/ax6-uboot-mibib.bin /dev/mtd1
mtd erase /dev/mtd7
mtd write /tmp/ax6-uboot.bin /dev/mtd7
```

**命令执行完成后直接拔掉电源！否则会变砖头！**

将电脑IP手动设置为 192.168.1.100，连接路由器的LAN口到电脑的RJ45接口上， 按住Reset重置孔的同时插入电源， 等待System LED变成黄灯后松开 Reset， 浏览器打开 192.168.1.1 即可进入 U-Boot。

（可以在浏览器提前打开192.168.1.1，再按住Reset插入电源，Uboot的Web界面出现后立刻松手，TTL可以发现这个Uboot是利用Reset连续被按下五秒钟触发中断的，所以其实不一定非要等到LED变黄，自己多把握几次就知道差不多是多久了。）

界面如图：

![Uboot界面](http://supes.top/wp-content/uploads/2022/05/Snipaste_2022-05-15_18-13-48.png#vwid=1877&vhei=926)

选择上面刷过一次的QSDK底包再次刷入即可。

**如果正确执行以上步骤仍无法进入Uboot的Web界面，则可以检查一下路由器网口上的网线是否有且只有路由器到你的电脑的这一根网线。或者是不是把网线插在WAN口上了。如果有其它的线，请不要图省事，全部拔掉，只留下路由器到你电脑的这一根网线！**

将电脑网络设置还原为自动获取IP和DNS， 等路由蓝灯常亮后 浏览器 输入 [10.0.0.1 ](http://10.0.0.1/)进入OpenWrt底包后台，利用Web界面刷入你准备好的sysupgrade固件即可，等待开机即可正常使用。

## 内存扩容

以上命令执行完成后，你应该可以获得一个运行OpenWRT的AX6。但是众所周知，OpenWRT的灵魂之一就是可以安装并扩展插件。为了保证这些插件可以流畅运行，所以对我的AX6进行内存扩容操作。

:::caution[警告]
**注意：这步操作风险很高！对硬件进行修改很有可能导致你的路由器发生不可修复的损坏！非专业人士请勿操作！**
:::

### 准备工作

你需要以下物品可完成此项操作。

元器件：MT41K512M16HA-125（D9STQ）

软件：Xshell等支持ssh的终端工具，WinSCP等SCP协议文件传输工具，AX6的1GB CDT文件（[点此下载](https://raw.githubusercontent.com/Kazusa1085/Redmi-AX6_OpFiles/main/cdt-AX6_1G.bin)）

工具：焊台，热风枪，镊子，助焊剂等贴片焊接工具。

确保你的路由器没有还没用的保修。

### 更换颗粒

参考[ACWIFI的拆机教程](https://www.acwifi.net/11176.html)拆开外壳。

**需要注意的是，该教程没有提到底部的贴纸下面还有两颗螺丝！一定要拆掉否则大力会掰断上盖！**

~~放心，我自己的没掰断~~

拆开之后大概长这个样子

![AX6拆机][1]

拧掉四个螺丝，移除铝制散热片。

![AX6主板][2]

**如果在这一步很难移除散热片，可以尝试用镊子的尾巴去捅散热片和屏蔽罩之间的导热垫。捅两下就开。但是不要刮到下面的PCB，刮断了就寄了。**

移除左下角空焊的TTL旁边的屏蔽罩。（是这个板子上最大的那个金属壳）

如果用镊子从下面撬不动的话，可以试试用硬质的东西伸到转角处的夹缝位置掰到微微翘起再撬，撬开一个角就不要上镊子了，直接上手扣就行。指甲可比镊子尖要安全得多。

撬开之后如图（此处引用ACWIFI的图片，侵删。）：

![红米AX6拆机](https://www.acwifi.net/wp-content/uploads/2020/08/SAM_8004-800x533.jpg#vwid=800&vhei=533)

我们需要更换的就是途中的EM6HE16EWAKG-10H那个芯片。

侧边加少量焊油（助焊剂），2008D风枪360度50风速转圈加热，用镊子轻轻推动芯片，发现芯片活动即可将其取下。

加一点焊油润滑，使用吸锡带清理干净焊盘，使用洗板水把焊盘擦干净。

在干净的焊盘上抹薄薄一层焊油，把植锡后的D9STQ放上去，尽量对准主板上的焊盘。

风枪360度40-60风均匀预热后集中加热芯片，看到芯片自动归位动作后可以停止加热。

更换完成后效果如图所示：

![更换效果][3]

等待温度降到室温后则可以插电测试。

### 刷写CDT

如果以上步骤没有出意外，则此时应该已经可以开进进入OpenWRT，概览界面此时应该还显示是512MB可用，因为还没刷CDT，系统只能用到其中原来那部分的内存空间。通过刷新CDT分区就可以解决这个问题。

使用WinSCP连接路由器，将cdt文件放入tmp分区下，执行以下命令。

```shell
mtd write /tmp/cdt-AX6_1G.bin /dev/mtd5
reboot
```

重启后应该就会认到900多MB的可用内存了。

## Q/A

**Q：为什么要刷两遍QSDK？**

A：因为小米官方固件采用的是A/B系统方案，RootFS和RootFS_1对应着A系统和B系统，每次更新会刷新另一个分区的数据，比如在A分区系统更新就会把固件写入到B分区，更新结束之后会自动重启到另一个分区。第一次刷写的QSDK就是把QSDK底包刷写到了非活动状态的另一个分区中，再通过命令把启动分区切换到被刷入QSDK的分区中实现底包刷写的。刷这一遍是因为在小米官方固件下，mtd相关的命令（刷写Uboot时使用的mtd write/erase）是无法使用的。所以需要刷一遍这个底包来让这两条命令可用。

在Uboot下刷的第二遍QSDK底包是因为在刷Uboot过程中，刷入的位于mtd1的mibib文件修改了设备本身的分区表，将原来的RootFS，RootFS_1，OverLay三个小分区合并成了一个大的RootFS。原来刷入的QSDK因为分区表改变了自然无法正常启动。这次刷入是为了把这个底包刷入到这个大的RootFS分区中，之后刷sysupgrade固件的时候就会直接把固件写入QSDK所在的大分区中了。**就是“扩容刷机”中的“扩容”**。

总结一下就是**第一次刷是解锁一些命令的使用权，第二次是为了向扩容后的分区写入OpenWRT。**

**Q：AX3600解锁的时候不是一条链接就搞定了吗？为什么AX6这么费劲？**

A：小米全系列Wifi6除了最先出的AX3600之外固件都对原来的方式做了修复，原来的方式已经失效了。不信你可以自己去试试。

**Q：我解锁完SSH之后5G密码并没有改变，我该去哪里获取我的SSH密码？**

A：[点击链接进入网页](https://carrotdev-d.github.io/Xiaomi-SN-code-calculation/)，自己算。

使用你路由器的SN码就可以算出你的默认SSH密码，但是你没解锁成功的话，算出来了你也连不上。

**Q：焊接时一定要按照描述的操作执行吗？**

A：焊接这一步建议使用自己熟悉的方式。贴片焊接无所谓你开多少温度，能把温度控制在芯片下面的锡刚好熔化你用打火机都可以。焊接成功的标志就是芯片由于锡珠的表面张力的自动归位动作。上面描述的方法仅供参考，翻车了也不怪我嗷，我就是这个温度成功的。

**Q：CDT刷错了怎么办？**

A：刷错文件的话可以使用TTL在Uboot环境下刷入正确的文件。刷错分区的话，没有备份那就寄，~~建议50出我~~。

**Q：你折腾AX6干啥，这机器纯fw。**

A：给我爪巴！




/*Refreshed: Kazusa1085*/

/*Update at 2025.07.02, 07:08*/


[1]: https://blog.raana.icu/picx-images-hosting/20250702/IMG_20250702_035508.3d52fbs2xc.webp
[2]: https://blog.raana.icu/picx-images-hosting/20250702/IMG_20250702_035438.9dd8k21olw.webp
[3]: https://blog.raana.icu/picx-images-hosting/20250702/IMG_20250702_035423.6pns9p8na1.webp
