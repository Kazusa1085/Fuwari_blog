# 关于&隐私政策

最后更新日期：2025年12月

## 概述

本网站是一个静态网站，采用Fuwari框架，并使用MIT协议开源于Github，我们非常重视您的隐私。本隐私政策说明了当您访问我们的网站时，可能收集、使用和披露您信息的方式。

### 初代版本仓库

::github{repo="afoim/fuwari"}

### 当前版本

::github{repo="Besty0728/fuwari"}

## 网站性质

本网站是一个静态网站，这意味着：
- 我们不会在服务器端存储您的个人信息
- 网站内容是预先生成的，不会动态处理用户数据
- 我们不会主动收集或存储您的个人信息

## 第三方服务

尽管本网站本身是静态的，但我们使用了以下第三方服务，这些服务可能会收集和处理您的信息：

### CDN 和托管服务

根据您访问的节点不同，以下服务提供商可能会收集您的信息：

**Cloudflare**
- 可能收集的信息：IP 地址、访问时间、请求的页面、浏览器信息
- 用途：提供 CDN 服务、安全防护、性能优化
- 隐私政策：[Cloudflare 隐私政策](https://www.cloudflare.com/privacypolicy/)

**EdgeOne**
- 可能收集的信息：IP 地址、访问日志、性能数据
- 用途：网站托管、部署服务
- 隐私政策：[EdgeOne 隐私政策](https://cloud.tencent.com/document/product/1552/90778)

### 分析和统计服务

**Google Analytics（谷歌分析）**
- 可能收集的信息：匿名化的用户数据、页面浏览量、会话时长、地理位置
- 用途：网站性能分析、用户行为分析
- 隐私政策：[Google 隐私政策](https://policies.google.com/privacy)

**Umami 分析**
- 可能收集的信息：页面浏览量、访问来源、设备类型（匿名化处理）
- 用途：网站流量统计和分析
- 特点：注重隐私保护，不使用 Cookie，数据匿名化处理
- 实时查看：您可以在网站导航栏中实时查看站点流量统计
- Cookie 同意：**无需同意**，Umami 不使用 Cookie，始终运行

### 广告服务

**Google AdSense（谷歌广告）**
- 可能收集的信息：Cookie、设备标识符、浏览行为、兴趣偏好
- 用途：展示个性化广告
- 特点：仅在用户同意 Cookie 后加载
- 隐私政策：[Google 隐私政策](https://policies.google.com/privacy)

### 评论服务

**Giscus**
- 基于 GitHub Discussions 的评论系统
- 可能收集的信息：GitHub 账户信息（仅在您主动登录评论时）
- 特点：不使用 Cookie，不追踪用户
- 隐私政策：[GitHub 隐私声明](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)

## Cookie 和本地存储

我们的网站可能使用以下技术：
- **Cookie**：用于网站功能和第三方服务（Google Analytics、Google AdSense）
- **本地存储**：用于保存用户偏好设置（如主题选择、Cookie 同意状态）
- **会话存储**：用于临时存储页面状态

### Cookie 使用说明

| 服务 | 类型 | 用途 | 是否需要同意 |
|------|------|------|-------------|
| Google Analytics | 第三方 Cookie | 匿名统计用户行为 | ✅ 是 |
| Google AdSense | 第三方 Cookie | 展示个性化广告 | ✅ 是 |
| Umami | 无 Cookie | 匿名流量统计 | ❌ 否（隐私友好） |
| 主题/偏好设置 | 本地存储 | 保存您的显示偏好 | ❌ 否（功能必需） |

### 管理您的 Cookie 设置

您可以随时更改 Cookie 同意状态。点击下方按钮重置设置后，下次刷新页面将重新显示 Cookie 同意横幅。

<button id="reset-cookie-consent" style="padding:8px 20px;border-radius:8px;border:none;background:var(--primary,#a78bfa);color:#fff;font-size:14px;cursor:pointer;font-weight:600;margin:8px 0;">重置 Cookie 设置 / Reset Cookie Preferences</button>
<span id="reset-cookie-msg" style="margin-left:10px;font-size:13px;color:var(--primary,#a78bfa);display:none;"></span>

<script>
document.getElementById('reset-cookie-consent')?.addEventListener('click',function(){
  localStorage.removeItem('cookie-consent');
  var msg=document.getElementById('reset-cookie-msg');
  msg.textContent='✅ 已重置，刷新页面后将重新显示 Cookie 横幅 / Reset done, refresh to see the banner again.';
  msg.style.display='inline';
});
</script>

### 如何清理浏览器 Cookie

如果您希望彻底清除本站及第三方服务存储的 Cookie，可按以下步骤操作：

**Chrome / Edge**：设置 → 隐私和安全 → 清除浏览数据 → 勾选"Cookie 和其他网站数据" → 清除数据

**Firefox**：设置 → 隐私与安全 → Cookie 和网站数据 → 清除数据

**Safari**：偏好设置 → 隐私 → 管理网站数据 → 搜索本站域名 → 移除

> 💡 提示：清除 Cookie 后，您的主题偏好等本地设置也会被重置。如果只想重置 Cookie 同意状态，请使用上方的"重置 Cookie 设置"按钮。

## 您的权利

您有权：
- 了解我们收集的信息类型
- 要求删除您的个人信息（如适用）
- 选择退出某些数据收集
- 禁用 Cookie 和 JavaScript（可能影响网站功能）

## 如何保护您的隐私

您可以通过以下方式保护您的隐私：
- 使用隐私浏览模式
- 禁用第三方 Cookie
- 使用广告拦截器
- 使用 VPN 服务
- 定期清理浏览器数据

## 数据安全

虽然我们不直接收集您的个人信息，但我们：
- 使用 HTTPS 加密传输
- 选择信誉良好的第三方服务提供商
- 定期审查第三方服务的隐私政策

## 儿童隐私

我们的网站不专门针对 14 岁以下的儿童。我们不会故意收集 14 岁以下儿童的个人信息。

## 隐私政策更新

我们可能会不时更新本隐私政策。任何更改都会在此页面上发布，重大更改会通过网站公告通知用户。

## 联系我们

如果您对本隐私政策有任何疑问或关注，请通过以下方式联系我们：
- 通过网站联系页面
- 发送邮件至网站管理员

我们将认真对待每一个举报，并在收到举报后及时处理相关问题。

## 适用法律

本隐私政策受中华人民共和国法律管辖。我们努力遵守适用的数据保护法律法规。

---

*本隐私政策旨在透明地说明我们的数据处理实践。我们建议您定期查看本政策以了解任何更新。*