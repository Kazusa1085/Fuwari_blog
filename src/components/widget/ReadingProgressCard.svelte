<script>
import { onDestroy, onMount } from "svelte";
import {
	destroyReadingProgress,
	initReadingProgress,
	isPostPage,
	readingProgress,
} from "../../stores/readingProgress";

let progress = $state(0);
let visible = $state(false);

// 订阅 store
const unsubProgress = readingProgress.subscribe((v) => (progress = v));
const unsubVisible = isPostPage.subscribe((v) => (visible = v));

onMount(() => {
	initReadingProgress();
});

onDestroy(() => {
	unsubProgress();
	unsubVisible();
});
</script>

<!-- 侧边栏进度卡片 -->
{#if visible}
    <div
        id="sidebar-progress-card"
        class="px-4 py-3 transition-all duration-300"
    >
        <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
                <div class="h-4 w-1 rounded-full bg-[var(--primary)]"></div>
                <span class="text-sm font-bold text-neutral-900 dark:text-neutral-100"
                    >阅读进度</span
                >
            </div>
            <span class="text-sm font-bold text-[var(--primary)]"
                >{progress}%</span
            >
        </div>

        <div
            class="w-full h-1.5 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden"
        >
            <div
                class="h-full rounded-full transition-all duration-150 ease-out"
                style="width: {progress}%; background: linear-gradient(90deg, oklch(0.70 0.14 var(--hue, 250)), oklch(0.60 0.16 var(--hue, 250)));"
            ></div>
        </div>
    </div>
{/if}
