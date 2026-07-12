// 内容分离同步脚本
//
// 文章 (posts)、友链 (friends)、项目 (projects) 存放在独立仓库
// https://github.com/Kazusa1085/Blog_Archive 中，通过这个脚本在
// `pnpm dev` / `pnpm build` 前自动同步到本地的 content/ 目录。
// content.config.ts 里这三个 collection 的 base 路径直接指向 content/，
// 不使用符号链接，跨平台（包括 Windows）都能正常工作。
//
//   ENABLE_CONTENT_SYNC 不是 "true"
//     -> 什么都不做，直接使用 content/ 目录里现有的内容（本地模式）
//
//   ENABLE_CONTENT_SYNC=true 且设置了 CONTENT_REPO_URL
//     -> content/.git 已存在：拉取更新（fetch + 强制同步到远程分支）
//     -> content/ 存在但不是 git 仓库（比如 Fork 之后继承来的内容）：
//        先重命名备份成 content.backup-<时间戳>/，再全新 clone
//     -> content/ 不存在：直接 clone
//
// 环境变量可以来自本地 .env 文件，也可以来自 CI（比如 GitHub Actions
// 工作流里的 env: 配置）——两种方式都支持，CI 里通常不会有 .env 文件，
// 直接由工作流本身注入 ENABLE_CONTENT_SYNC / CONTENT_REPO_URL 即可。
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

try {
	process.loadEnvFile(path.join(rootDir, ".env"));
} catch {
	// 没有 .env 文件也没关系，可能是在 CI 里通过环境变量直接注入的
}

const ENABLE_CONTENT_SYNC = process.env.ENABLE_CONTENT_SYNC === "true";
const CONTENT_REPO_URL = process.env.CONTENT_REPO_URL || "";
const CONTENT_DIR = path.resolve(
	rootDir,
	process.env.CONTENT_DIR || "content",
);

function run(cmd, cwd) {
	execSync(cmd, { stdio: "inherit", cwd });
}

if (!ENABLE_CONTENT_SYNC) {
	console.log("[内容分离] 未启用（ENABLE_CONTENT_SYNC 不是 true），使用 content/ 目录下的本地内容。");
	process.exit(0);
}

if (!CONTENT_REPO_URL) {
	console.warn("[内容分离] ENABLE_CONTENT_SYNC=true 但未设置 CONTENT_REPO_URL，跳过同步，使用本地内容。");
	process.exit(0);
}

try {
	const isGitRepo = fs.existsSync(path.join(CONTENT_DIR, ".git"));

	if (isGitRepo) {
		console.log(`[内容分离] 检测到已克隆的内容仓库，正在拉取更新：${CONTENT_DIR}`);
		run("git fetch --all --prune", CONTENT_DIR);

		let branch = "main";
		try {
			execSync("git rev-parse --verify origin/main", { cwd: CONTENT_DIR });
		} catch {
			branch = "master";
		}
		run(`git checkout ${branch}`, CONTENT_DIR);
		run(`git reset --hard origin/${branch}`, CONTENT_DIR);
		console.log(`[内容分离] 同步完成（分支：${branch}）`);
	} else {
		if (fs.existsSync(CONTENT_DIR)) {
			const backupDir = `${CONTENT_DIR}.backup-${Date.now()}`;
			console.log(`[内容分离] content/ 已存在但不是独立仓库，先备份到：${backupDir}`);
			fs.renameSync(CONTENT_DIR, backupDir);
		}

		console.log(`[内容分离] 正在克隆内容仓库：${CONTENT_REPO_URL}`);
		run(`git clone --depth 1 "${CONTENT_REPO_URL}" "${CONTENT_DIR}"`, rootDir);
		console.log("[内容分离] 克隆完成。");
	}
} catch (error) {
	console.warn("[内容分离] 同步失败，将使用当前 content/ 目录下已有的内容继续构建：", error.message);
}
