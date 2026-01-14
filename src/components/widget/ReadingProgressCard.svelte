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
        class="card-base p-4 transition-all duration-300 onload-animation"
        style="animation-delay: 400ms"
    >
        <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
                <div class="h-5 w-1 rounded-full bg-[var(--primary)]"></div>
                <span class="font-bold text-neutral-900 dark:text-neutral-100"
                    >阅读进度</span
                >
            </div>
            <span class="text-lg font-bold text-[var(--primary)]"
                >{progress}%</span
            >
        </div>

        <div
            class="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden"
        >
            <div
                class="h-full rounded-full transition-all duration-150 ease-out"
                style="width: {progress}%; background: linear-gradient(90deg, oklch(0.70 0.14 var(--hue, 250)), oklch(0.60 0.16 var(--hue, 250))); box-shadow: 0 0 8px oklch(0.65 0.18 var(--hue, 250) / 0.4);"
            ></div>
        </div>
    </div>
{/if}
