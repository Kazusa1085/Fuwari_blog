<script lang="ts">
import Icon from "@components/Icon.svelte";
import { onMount } from "svelte";
import { url } from "@utils/url-utils.ts";

interface SearchResult {
	url: string;
	meta: { title: string };
	excerpt: string;
	urlPath?: string;
}

let keywordDesktop = "";
let keywordMobile = "";
let result: SearchResult[] = [];
let isSearching = false;
let posts: any[] = [];
let postsLoaded = false;
let loadingPosts = false;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

const panel = (): HTMLElement | null => document.getElementById("search-panel");
const ensurePosts = async (): Promise<void> => {
	if (postsLoaded || loadingPosts) return;
	loadingPosts = true;
	try {
		const response = await fetch("/rss.xml");
		if (!response.ok) throw new Error(`RSS ${response.status}`);
		const text = await response.text();
		const xml = new DOMParser().parseFromString(text, "text/xml");
		posts = Array.from(xml.querySelectorAll("item")).map((item) => {
			const contentEncoded =
				item.getElementsByTagNameNS("*", "encoded")[0]?.textContent ||
				item.querySelector("*|encoded")?.textContent ||
				"";
			return {
				title: item.querySelector("title")?.textContent || "",
				description: item.querySelector("description")?.textContent || "",
				content: contentEncoded.replace(/<[^>]*>/g, ""),
				link:
					item
						.querySelector("link")
						?.textContent?.replace(/.*\/posts\/(.*?)\//, "$1") || "",
			};
		});
		postsLoaded = true;
	} catch (error) {
		console.error("Error fetching RSS:", error);
	} finally {
		loadingPosts = false;
	}
};

const setPanelVisibility = (show: boolean, isDesktop: boolean): void => {
	if (!isDesktop) return;
	const el = panel();
	if (!el) return;
	el.classList.toggle("float-panel-closed", !show);
};

const closePanel = (): void => {
	panel()?.classList.add("float-panel-closed");
};

const togglePanel = (): void => {
	const el = panel();
	if (!el) return;
	const willOpen = el.classList.contains("float-panel-closed");
	el.classList.toggle("float-panel-closed");
	if (willOpen) {
		void ensurePosts();
		requestAnimationFrame(() => {
			(
				document.getElementById(
					"search-input-mobile",
				) as HTMLInputElement | null
			)?.focus();
		});
	}
};

const search = async (keyword: string, isDesktop: boolean): Promise<void> => {
	if (!keyword.trim()) {
		setPanelVisibility(false, isDesktop);
		result = [];
		return;
	}
	await ensurePosts();
	isSearching = true;
	try {
		const keywordLower = keyword.toLowerCase();

		result = posts
			.filter((post) => {
				const searchText =
					`${post.title} ${post.description} ${post.content}`.toLowerCase();
				const urlPath = `/posts/${post.link}`;
				return (
					searchText.includes(keywordLower) ||
					urlPath.toLowerCase().includes(keywordLower) ||
					post.link.toLowerCase().includes(keywordLower)
				);
			})
			.map((post) => {
				const contentLower = post.content.toLowerCase();
				const contentIndex = contentLower.indexOf(keywordLower);
				let excerpt = "";
				if (contentIndex !== -1) {
					const start = Math.max(0, contentIndex - 50);
					const end = Math.min(post.content.length, contentIndex + 100);
					excerpt = post.content.substring(start, end);
					if (start > 0) excerpt = `...${excerpt}`;
					if (end < post.content.length) excerpt = `${excerpt}...`;
				} else {
					excerpt = post.description || `${post.content.substring(0, 150)}...`;
				}
				return {
					url: url(`/posts/${post.link}/`),
					meta: { title: post.title },
					excerpt,
					urlPath: `/posts/${post.link}`,
				};
			});
		setPanelVisibility(result.length > 0, isDesktop);
	} catch (error) {
		console.error("Search error:", error);
		result = [];
		setPanelVisibility(false, isDesktop);
	} finally {
		isSearching = false;
	}
};

const scheduleSearch = (keyword: string, isDesktop: boolean): void => {
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => void search(keyword, isDesktop), 150);
};

onMount(() => {
	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === "Escape") closePanel();
	};
	window.addEventListener("keydown", onKeyDown);
	return () => window.removeEventListener("keydown", onKeyDown);
});

$: scheduleSearch(keywordDesktop, true);
$: scheduleSearch(keywordMobile, false);
</script>

<!-- search bar for desktop view -->
<div id="search-bar" class="hidden lg:flex transition-all items-center h-11 mr-2 rounded-lg
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
">
    <label for="search-input-desktop" class="sr-only">搜索文章</label>
    <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
    <input id="search-input-desktop" placeholder="搜索" bind:value={keywordDesktop}
           on:focus={() => void ensurePosts()}
           class="transition-all pl-10 text-sm bg-transparent outline-0
         h-full w-40 focus:w-52 text-black/50 dark:text-white/50"
    >
</div>

<!-- toggle btn for phone/tablet view -->
<button on:click={togglePanel} aria-label="搜索" aria-controls="search-panel" aria-expanded="false" id="search-switch"
        class="btn-plain scale-animation lg:!hidden rounded-lg w-11 h-11 active:scale-90">
    <Icon icon="material-symbols:search" class="text-[1.25rem]"></Icon>
</button>

<!-- search panel -->
<div id="search-panel" class="float-panel float-panel-closed search-panel absolute md:w-[30rem]
top-20 left-4 md:left-[unset] right-4 shadow-2xl rounded-2xl p-2" aria-label="搜索">

    <!-- search bar inside panel for phone/tablet -->
    <div id="search-bar-inside" class="flex relative lg:hidden transition-all items-center h-11 rounded-xl
      bg-black/[0.04] hover:bg-black/[0.06] focus-within:bg-black/[0.06]
      dark:bg-white/5 dark:hover:bg-white/10 dark:focus-within:bg-white/10
  ">
        <label for="search-input-mobile" class="sr-only">搜索文章</label>
        <Icon icon="material-symbols:search" class="absolute text-[1.25rem] pointer-events-none ml-3 transition my-auto text-black/30 dark:text-white/30"></Icon>
        <input id="search-input-mobile" placeholder="搜索" bind:value={keywordMobile}
               on:focus={() => void ensurePosts()}
               class="pl-10 absolute inset-0 text-sm bg-transparent outline-0
               focus:w-60 text-black/50 dark:text-white/50"
        >
    </div>

    <!-- search results -->
    <div id="search-results" aria-live="polite">
        {#if isSearching}
            <p class="text-sm text-50 px-3 py-2">搜索中...</p>
        {:else if keywordDesktop || keywordMobile}
            {#if result.length === 0}
                <p class="text-sm text-50 px-3 py-2">没有匹配的文章</p>
            {/if}
        {/if}
        {#each result as item}
            <a href={item.url}
               class="transition first-of-type:mt-2 lg:first-of-type:mt-0 group block
           rounded-xl text-lg px-3 py-2 hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]">
                <div class="transition text-90 inline-flex font-bold group-hover:text-[var(--primary)]">
                    {item.meta.title}<Icon icon="fa6-solid:chevron-right" class="transition text-[0.75rem] translate-x-1 my-auto text-[var(--primary)]"></Icon>
                </div>
                <div class="transition text-xs text-white mb-1 font-mono">
                    {item.urlPath}
                </div>
                <div class="transition text-sm text-50">
                    {item.excerpt}
                </div>
            </a>
        {/each}
    </div>
</div>

<style>
  input:focus {
    outline: 0;
  }
  .search-panel {
    max-height: calc(100vh - 100px);
    overflow-y: auto;
  }
</style>
