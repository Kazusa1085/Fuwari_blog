<script>
/**
 * 移动端/平板端固定顶部阅读进度条
 * 使用共享 store，避免重复滚动监听
 * lg 以上时与文章区域对齐，不覆盖侧边栏
 */
import { onDestroy, onMount } from "svelte";
import {
	initReadingProgress,
	isPostPage,
	readingProgress,
	showFixedBar,
} from "../stores/readingProgress";

let progress = $state(0);
let visible = $state(false);
let showFixed = $state(false);
let barLeft = $state("0px");
let barWidth = $state("100%");

const unsubProgress = readingProgress.subscribe((v) => (progress = v));
const unsubVisible = isPostPage.subscribe((v) => (visible = v));
const unsubFixed = showFixedBar.subscribe((v) => (showFixed = v));

function updateBarPosition() {
	const main = document.getElementById("swup-container");
	if (main && window.innerWidth >= 1024) {
		const rect = main.getBoundingClientRect();
		barLeft = rect.left + "px";
		barWidth = rect.width + "px";
	} else {
		barLeft = "0px";
		barWidth = "100%";
	}
}

onMount(() => {
	initReadingProgress();
	updateBarPosition();
	window.addEventListener("resize", updateBarPosition);
});

onDestroy(() => {
	unsubProgress();
	unsubVisible();
	unsubFixed();
	if (typeof window !== "undefined") {
		window.removeEventListener("resize", updateBarPosition);
	}
});
</script>

<!-- 移动端/平板端：固定顶部进度条（仅 <2xl 显示，且侧边栏卡片滚出后才显示） -->
{#if visible && showFixed}
    <div
        class="2xl:hidden fixed top-0 z-[60] px-4 py-2 bg-[var(--card-bg)] backdrop-blur-md border-b border-black/5 dark:border-white/10 shadow-sm transition-all duration-300 animate-slide-down"
        style="left: {barLeft}; width: {barWidth}; -webkit-backdrop-filter: blur(12px);"
    >
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <div class="h-4 w-1 rounded-full bg-[var(--primary)]"></div>
                <span
                    class="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                    >阅读进度</span
                >
            </div>
            <span class="text-sm font-bold text-[var(--primary)]"
                >{progress}%</span
            >
        </div>
        <div
            class="mt-1.5 w-full h-1 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden"
        >
            <div
                class="h-full rounded-full transition-all duration-150 ease-out"
                style="width: {progress}%; background: linear-gradient(90deg, oklch(0.70 0.14 var(--hue, 250)), oklch(0.60 0.16 var(--hue, 250)));"
            ></div>
        </div>
    </div>
{/if}

<style>
    @keyframes slide-down {
        from {
            opacity: 0;
            transform: translateY(-100%);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-slide-down {
        animation: slide-down 0.3s ease-out;
    }
</style>
