# AI Deployment Guide（Fuwari 定制部署 Runbook）

> 这是一份给 AI 助手的仓库内部署/定制 Runbook。
> 当用户说“帮我部署”“我想上线”“按这个仓库部署”时，请按照本文档流程执行：
> 先收集信息，再修改配置，最后验证。不要跳过环境变量检查。

---

## 0. AI 交互协议

开始前，AI 必须先问清楚以下问题。用户回答后，再决定后续步骤。

### 需要收集的信息

| # | 问题 | 用途 |
|---|---|---|
| 1 | 你 Fork 的仓库/项目名是什么？ | 确认远端仓库位置 |
| 2 | 你要部署到哪里：Vercel 还是 GitHub Pages？ | 选择部署分支 |
| 3 | 你的域名是什么？ | 改 `site`、CNAME、防盗链、HTTP 跳转 |
| 4 | 你有自己的内容仓库吗？还是文章直接放 `content/`？ | 配置内容同步 |
| 5 | 博客标题 / 副标题 / 作者名 / 头像 / 简介是什么？ | 修改 `src/config.ts` |
| 6 | 导航要哪些页？ | 修改 `navBarConfig` |
| 7 | 是否启用 Umami 统计？ | 修改 `umamiConfig` |
| 8 | 是否启用 Google Analytics？ | 修改 GA ID / 同意弹窗 |
| 9 | 是否启用 IndexNow？ | 配置 `INDEXNOW_KEY` / `INDEXNOW_HOST` |
| 10 | 是否启用 PoW 防爬 / 是否开启 `ALBIREO_ENABLED`？ | 配置中间件 |
| 11 | 内容仓库是公开还是私有？ | 决定是否需要 Token |
| 12 | 是否要保留 GitHub Pages 作为部署目标？ | 决定是否恢复 deploy job |

> 如果用户不确定，AI 应给出“推荐选项”并说明后果，不要擅自修改。

---

## 1. Fork 后必改项

### 1.1 站点基础信息

文件：`src/config.ts`

```ts
export const siteConfig: SiteConfig = {
  title: "你的博客名",
  subtitle: "你的副标题",
  description: "网站描述，会用于 SEO",
  lang: "zh_CN",
  themeColor: {
    hue: 345, // 主题色相，0-360
    fixed: true,
    forceDarkMode: true,
  },
  // ...
};
```

### 1.2 作者信息

```ts
export const profileConfig: ProfileConfig = {
  avatar: "https://你的头像地址",
  name: "你的名字",
  bio: ["一句话介绍"],
  links: [
    {
      name: "GitHub",
      icon: "fa6-brands:github-alt",
      url: "https://github.com/你的用户名",
    },
  ],
};
```

### 1.3 导航

```ts
export const navBarConfig: NavBarConfig = {
  links: [
    LinkPreset.Home,
    LinkPreset.Archive,
    LinkPreset.Friends,
    LinkPreset.Apps,
    LinkPreset.Works,
    LinkPreset.Stats,
  ],
};
```

### 1.4 站点域名

文件：`astro.config.mjs`

```js
export default defineConfig({
  site: "https://你的域名",
  // ...
});
```

### 1.5 防盗链 / 官方域名

文件：`src/config.ts` 和 `src/layouts/Layout.astro`

- `antiLeechConfig.officialSites` 改为你的域名。
- 两段域名安全提醒脚本中的 `v` / `_d` 数组中的 base64 也要对应你的域名。

> 如果没有改，会在非官方域名访问时弹出安全警告。

### 1.6 IndexNow Key

IndexNow 需要在 `public/` 放一个校验文件：

```text
public/{INDEXNOW_KEY}.txt
```

内容随意（通常是你 GitHub 用户名）。

---

## 2. 内容分离

### 2.1 使用独立内容仓库（推荐）

环境变量：

```text
ENABLE_CONTENT_SYNC=true
CONTENT_REPO_URL=https://github.com/你的用户名/你的内容仓库.git
```

Vercel / GitHub Actions 构建时会自动 clone 内容仓库到 `content/`。

#### 私有内容仓库

- 在 Vercel 环境变量或 GitHub Actions Secret 中设置完整地址：
  ```text
  CONTENT_REPO_URL=https://你的token@github.com/你的用户名/你的内容仓库.git
  ```
- 建议使用只读 Fine-grained PAT，不要使用有全仓库权限的 token。

### 2.2 不使用内容分离

将 `ENABLE_CONTENT_SYNC` 设为 `false`，并直接把文章/友链/项目放入：

```text
content/posts/
content/friends/
content/projects/
content/apps/
```

---

## 3. Vercel 部署

### 3.1 创建项目

1. Vercel Dashboard → Add New Project
2. 导入你的 GitHub 仓库
3. Framework：`Astro`
4. Build Command：`pnpm build`
5. Output Directory：`dist`
6. Install Command：`pnpm install`

### 3.2 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `ALBIREO_ENABLED` | 否（默认 true） | 是否开启 PoW 防爬 |
| `ALBIREO_SECRET` | 开启防爬时必填 | 签名 cookie 的随机密钥 |
| `ALBIREO_DIFFICULTY` | 否 | PoW 难度，建议 3~6 |
| `ALBIREO_CHALLENGE_TTL` | 否 | 挑战有效期，默认 5 分钟 |
| `ALBIREO_SOLVED_TTL` | 否 | 通过后 cookie 有效期，默认 24h |
| `ENABLE_CONTENT_SYNC` | 看情况 | 是否同步内容仓库 |
| `CONTENT_REPO_URL` | 看情况 | 内容仓库地址 |

生成密钥：

```bash
openssl rand -hex 32
```

### 3.3 配置 Deploy Hook

1. Vercel 项目 → Settings → Git → Deploy Hooks
2. 创建 Hook，选择 `main` 分支
3. 复制 Hook URL
4. 在内容仓库（或博客仓库）设置 GitHub Actions Secret：
   - `DEPLOY_HOOK_URLS` = Hook URL
   - 如果保留内容仓库通知，则还需要 `DISPATCH_TOKEN`

### 3.4 绑定域名

- 在 Vercel 添加你的域名
- 按 Vercel 提示修改 DNS
- 如果原来用 GitHub Pages，请关闭 GitHub Pages，否则 `*.github.io` 仍可直接访问内容

### 3.5 关闭 GitHub Pages

1. 仓库 Settings → Pages
2. 将 Source 改为 None / 关闭
3. 如果存在 CNAME 文件，确认已删除

---

## 4. GitHub Pages 部署

### 4.1 恢复 Pages 部署

当前 `.github/workflows/deploy.yml` 已注释掉 GitHub Pages 部署。如果需要恢复：

1. 取消 `permissions` 中 `pages: write` / `id-token: write` 注释
2. 取消 `build` 中 `Upload Pages artifact` 注释
3. 取消 `deploy` job 注释
4. 将 `concurrency.group` 改回 `pages`

### 4.2 CNAME

在仓库根目录添加 `CNAME` 文件：

```text
你的域名
```

### 4.3 GitHub Pages Source

仓库 Settings → Pages → Source 使用 GitHub Actions。

### 4.4 内容同步

GitHub Actions 构建时通过环境变量：

```text
ENABLE_CONTENT_SYNC=true
CONTENT_REPO_URL=https://github.com/你的用户名/你的内容仓库.git
```

如果内容仓库有更新需要通知博客仓库，保留 `DISPATCH_TOKEN`：

```text
Name: DISPATCH_TOKEN
Value: 有权限向博客仓库发 repository_dispatch 的 GitHub PAT
```

### 4.5 GitHub Pages 的 PoW 限制

GitHub Pages 是纯静态托管，**不能直接运行 Anubis/Albireo 中间件**。
如果需要在 GitHub Pages 上做 PoW 防爬，需要 Cloudflare Worker / VPS 反转代理，或迁移到 Vercel / Cloudflare Pages。

---

## 5. Analytics / IndexNow / Cookie

### 5.1 Umami

如果启用，需要修改：

```ts
export const umamiConfig = {
  enable: true,
  baseUrl: "https://你的umami域名",
  shareId: "你的shareId",
  timezone: "Asia/Shanghai",
};
```

### 5.2 Google Analytics

文件：`src/layouts/Layout.astro` 和 `src/config.ts`

```ts
export const googleAnalyticsConfig = {
  enable: true,
  measurementId: "G-XXXXXXXXXX",
};
```

### 5.3 IndexNow

环境变量 / GitHub Actions：

```text
INDEXNOW_KEY=你的key
INDEXNOW_HOST=你的域名
```

确保 `public/{key}.txt` 存在且内容匹配。

### 5.4 Cookie 弹窗文案

文件：`src/layouts/Layout.astro`

搜索 `cookie-consent-banner`，修改标题、描述、按钮文案。

---

## 6. PoW 防爬（Vercel Middleware）

中间件文件：`middleware.ts`

- `ALBIREO_ENABLED=false` 可完全关闭
- `ALBIREO_SECRET` 必须设置，否则 503
- SEO 白名单目前按 UA 放行，若需要更严格可改为校验 IP / 关闭白名单
- `npx vercel dev` 本地可测试

---

## 7. 部署后验证清单

- [ ] 首页正常打开
- [ ] 文章列表 / 文章页正常
- [ ] 友链 / 应用 / 作品集页面内容正常
- [ ] 如果没有内容分离，`content/` 下文章存在
- [ ] Cookie 弹窗正常
- [ ] Umami / GA 是否按预期加载
- [ ] IndexNow 是否提交成功
- [ ] 如果开启防爬：挑战页出现，SEO 放行
- [ ] 域名正确，GitHub Pages 是否已按需关闭
- [ ] 自定义配置（标题、头像、导航）生效

---

## 8. 常见问题

### 8.1 预览域名样式坏掉/字体错位

- 检查是否为非官方域名触发了“域名安全提醒”脚本注入。
- 脚本中的全局 `*` reset 已移除，但若 Fork 后修改过脚本，请确认没有重新加入。

### 8.2 内容同步失败

- 确认 `ENABLE_CONTENT_SYNC=true`
- 确认 `CONTENT_REPO_URL` 可访问
- 私有仓库需要 token
- 查看构建日志中的 `[内容分离]`

### 8.3 Vercel 上友链/文章为空

- 可能是因为内容仓库未同步成功
- 让构建日志里出现 `[内容分离] 正在克隆内容仓库`

### 8.4 GitHub Pages 仍然能访问

- 关闭 Pages Source
- 删除 CNAME（如不需要）
- 检查 DNS 是否已经指向新平台

---

## 9. AI 修改规范

- 所有 Secret 只使用占位符，不要真实输出到聊天/日志。
- 修改配置文件前先读原文件，保留必要注释。
- 每次改完给出“下一步让用户做什么”。
- 如果用户 Fork 后想保留 GitHub Pages，不要删除 Pages 相关代码，只用注释。
- 如果需要改主题/颜色/字体，优先改 `src/config.ts` 和 `src/styles/`，不要大范围重写组件。
