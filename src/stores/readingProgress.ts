/**
 * 阅读进度共享状态
 * 统一管理滚动监听，避免多个组件重复监听
 */
import { writable } from "svelte/store";

// 共享状态
export const readingProgress = writable(0);
export const isPostPage = writable(false);
export const showFixedBar = writable(false);

let initialized = false;
let cleanup: (() => void) | null = null;
let sidebarCardRef: HTMLElement | null = null;
let lastScrollTime = 0;
const THROTTLE_MS = 16; // ~60fps

function updateProgress() {
	const now = performance.now();
	if (now - lastScrollTime < THROTTLE_MS) return;
	lastScrollTime = now;

	const scrollTop = window.scrollY || document.documentElement.scrollTop;
	const docHeight = document.documentElement.scrollHeight - window.innerHeight;

	// 缓存 DOM 引用
	if (!sidebarCardRef) {
		sidebarCardRef = document.getElementById("sidebar-progress-card");
	}

	// 检测侧边栏卡片是否滚出视野
	if (sidebarCardRef) {
		const cardRect = sidebarCardRef.getBoundingClientRect();
		showFixedBar.set(cardRect.bottom < 0);
	} else {
		showFixedBar.set(scrollTop > 600);
	}

	if (docHeight <= 0) {
		readingProgress.set(0);
		return;
	}

	const progress = Math.min(Math.round((scrollTop / docHeight) * 100), 100);
	readingProgress.set(progress);
}

export function initReadingProgress() {
	const isPost = window.location.pathname.includes("/posts/");
	isPostPage.set(isPost);

	if (!isPost) {
		readingProgress.set(0);
		showFixedBar.set(false);
		return;
	}

	// 清除之前的缓存引用
	sidebarCardRef = null;

	// 初始更新
	updateProgress();

	if (!initialized) {
		window.addEventListener("scroll", updateProgress, { passive: true });
		initialized = true;

		cleanup = () => {
			window.removeEventListener("scroll", updateProgress);
			initialized = false;
			sidebarCardRef = null;
		};
	}
}

export function destroyReadingProgress() {
	if (cleanup) {
		cleanup();
		cleanup = null;
	}
}

// Swup 页面切换支持
function setupSwupHooks() {
	if (!window.swup?.hooks) return;

	window.swup.hooks.on("page:view", () => {
		// 重置并重新初始化
		sidebarCardRef = null;
		setTimeout(initReadingProgress, 50);
	});
}

// 自动初始化
if (typeof window !== "undefined") {
	if (window.swup?.hooks) {
		setupSwupHooks();
	} else {
		document.addEventListener("swup:enable", setupSwupHooks);
	}
}
