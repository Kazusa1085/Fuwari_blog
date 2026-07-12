#!/usr/bin/env node
/**
 * 自动更新文章的 updated 字段
 * 
 * 用法:
 *   node scripts/update-post-timestamp.mjs [文件路径]
 * 
 * 示例:
 *   node scripts/update-post-timestamp.mjs content/posts/my-post.md
 * 
 * 如果不带参数，则检查所有已修改的文章文件（基于 git status）
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT_DIR, 'content/posts');

// 获取当前本地时间的 ISO 格式（不带时区标识，方便阅读）
function getLocalISOTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// 更新单个文件的 updated 字段
function updatePostTimestamp(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`文件不存在: ${filePath}`);
        return false;
    }

    let content = fs.readFileSync(filePath, 'utf-8');
    // 移除 BOM 并统一换行符为 LF
    content = content.replace(/^\ufeff/, '').replace(/\r\n/g, '\n');
    
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (!frontmatterMatch) {
        console.error(`无法解析 frontmatter: ${filePath}`);
        return false;
    }

    const frontmatter = frontmatterMatch[1];
    const newTimestamp = getLocalISOTime();
    
    let newFrontmatter;
    if (frontmatter.includes('updated:')) {
        // 更新现有的 updated 字段
        newFrontmatter = frontmatter.replace(/updated:\s*.+/, `updated: ${newTimestamp}`);
    } else {
        // 在 published 后添加 updated 字段
        newFrontmatter = frontmatter.replace(
            /(published:\s*.+)/,
            `$1\nupdated: ${newTimestamp}`
        );
    }

    const newContent = content.replace(frontmatterMatch[0], `---\n${newFrontmatter}\n---`);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    
    console.log(`✓ 已更新: ${path.basename(filePath)} -> updated: ${newTimestamp}`);
    return true;
}

// 获取 git 中已修改的 markdown 文件
function getModifiedPosts() {
    try {
        const output = execSync('git status --porcelain', { cwd: ROOT_DIR, encoding: 'utf-8' });
        const lines = output.split('\n').filter(Boolean);
        
        return lines
            .filter(line => line.includes('content/posts/') && line.endsWith('.md'))
            .map(line => {
                const filePath = line.slice(3).trim();
                return path.join(ROOT_DIR, filePath);
            });
    } catch (error) {
        console.error('无法获取 git 状态:', error.message);
        return [];
    }
}

// 主函数
function main() {
    const args = process.argv.slice(2);
    
    if (args.length > 0) {
        // 更新指定文件
        const filePath = path.resolve(args[0]);
        updatePostTimestamp(filePath);
    } else {
        // 检查所有已修改的文章
        const modifiedPosts = getModifiedPosts();
        
        if (modifiedPosts.length === 0) {
            console.log('没有检测到已修改的文章文件');
            return;
        }

        console.log(`检测到 ${modifiedPosts.length} 个已修改的文章文件:\n`);
        modifiedPosts.forEach(filePath => {
            updatePostTimestamp(filePath);
        });
    }
}

main();
