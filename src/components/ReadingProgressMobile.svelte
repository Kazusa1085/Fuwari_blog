<script>
/**
 * 移动端固定顶部阅读进度条
 * 使用共享 store，避免重复滚动监听
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

// 订阅 store
const unsubProgress = readingProgress.subscribe((v) => (progress = v));
const unsubVisible = isPostPage.subscribe((v) => (visible = v));
const unsubFixed = showFixedBar.subscribe((v) => (showFixed = v));

onMount(() => {
	initReadingProgress();
});

onDestroy(() => {
	unsubProgress();
	unsubVisible();
	unsubFixed();
});
</script>

<!-- 移动端：固定顶部进度条（仅 <lg 显示，且侧边栏卡片滚出后才显示） -->
{#if visible && showFixed}
    <div
        class="lg:hidden fixed top-0 left-0 right-0 z-[60] px-4 py-2 bg-[var(--card-bg)] backdrop-blur-md border-b border-black/5 dark:border-white/10 shadow-sm transition-all duration-300 animate-slide-down"
        style="-webkit-backdrop-filter: blur(12px);"
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
