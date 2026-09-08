// 清理 Astro 内容层缓存，避免旧缓存中固化的 Expressive Code 样式哈希
// 与本次构建实际生成的资源文件名不一致，导致构建产物引用 404 的 CSS。
//
// 相关上游问题：https://github.com/expressive-code/expressive-code/issues/351
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

for (const dir of [".astro", path.join("node_modules", ".astro")]) {
	fs.rmSync(path.join(rootDir, dir), { recursive: true, force: true });
}

console.log("[构建缓存] 已清理 .astro 与 node_modules/.astro");
