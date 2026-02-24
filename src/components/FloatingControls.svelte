<script lang="ts">
  import { onMount } from "svelte";

  // 排序模式
  type SortMode = "published" | "updated" | "views";
  const sortModes: { key: SortMode; label: string; icon: string }[] = [
    { key: "published", label: "文章创作时间", icon: "calendar" },
    { key: "updated", label: "文章更新时间", icon: "edit" },
    { key: "views", label: "浏览量排序", icon: "fire" },
  ];

  let currentSortIndex = 0;
  let isBackgroundHidden = false;
  let showBackToTop = false;
  let isHomePage = false;
  let isHotPage = false;
  let isPostPage = false;

  // 切换排序
  function cycleSortMode() {
    currentSortIndex = (currentSortIndex + 1) % sortModes.length;
    const mode = sortModes[currentSortIndex];
    localStorage.setItem("post-sort-mode", mode.key);

    if (mode.key === "views") {
      sessionStorage.setItem("sort-toast", `已按${mode.label}排序`);
      window.location.href = "/hot/";
      return;
    }
    if (mode.key === "published" && isHotPage) {
      sessionStorage.setItem("sort-toast", `已按${mode.label}排序`);
      window.location.href = "/";
      return;
    }

    sortPosts(mode.key);
    showToast(`已按${mode.label}排序（当前页）`);
  }

  // 排序文章
  function sortPosts(mode: SortMode) {
    const container = document.querySelector(
      ".post-list-container"
    ) as HTMLElement;
    if (!container) return;

    const cards = [
      ...container.querySelectorAll('[id^="post-card-"]'),
    ] as HTMLElement[];
    if (cards.length === 0) return;

    // 分离置顶和非置顶文章
    const pinnedCards = cards.filter((c) => c.dataset.pinned === "true");
    const normalCards = cards.filter((c) => c.dataset.pinned !== "true");

    // 只对非置顶文章排序
    normalCards.sort((a, b) => {
      if (mode === "views") {
        const slugA = a.dataset.slug || "";
        const slugB = b.dataset.slug || "";
        const viewsA = (window as any).umamiCache?.[slugA]?.pageViews || 0;
        const viewsB = (window as any).umamiCache?.[slugB]?.pageViews || 0;
        return viewsB - viewsA;
      }
      return Number(b.dataset[mode] || 0) - Number(a.dataset[mode] || 0);
    });

    // 重新排列 DOM：置顶在前，排序后的普通文章在后
    [...pinnedCards, ...normalCards].forEach((card) =>
      container.appendChild(card)
    );
  }

  // Toast 提示
  function showToast(message: string) {
    const existing = document.getElementById("sort-toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.id = "sort-toast";
    toast.className = "sort-toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

  // 切换背景展示模式
  function toggleBackground() {
    isBackgroundHidden = !isBackgroundHidden;
    const mainContent = document.getElementById("main-content-wrapper");
    const navbar = document.getElementById("navbar-wrapper");
    const toc = document.getElementById("toc-wrapper");

    if (isBackgroundHidden) {
      if (mainContent) mainContent.style.display = "none";
      if (navbar) navbar.style.display = "none";
      if (toc) toc.style.display = "none";
      document.body.style.overflow = "hidden";
      showExitHint();
    } else {
      if (mainContent) mainContent.style.display = "";
      if (navbar) navbar.style.display = "";
      if (toc) toc.style.display = "";
      document.body.style.overflow = "";
      hideExitHint();
    }
  }

  function showExitHint() {
    const existingHint = document.getElementById("bg-exit-hint");
    if (existingHint) return;

    const hint = document.createElement("div");
    hint.id = "bg-exit-hint";
    hint.className = "bg-exit-hint";
    hint.innerHTML = `
            <div class="hint-content">
                <div class="hint-icon">👆</div>
                <div class="hint-text">点击按钮或按 ESC 键退出</div>
            </div>
        `;
    document.body.appendChild(hint);
    setTimeout(() => hint.classList.add("fade-out"), 3000);
  }

  function hideExitHint() {
    const hint = document.getElementById("bg-exit-hint");
    if (hint) hint.remove();
  }

  // 滚动到评论区
  function scrollToComments() {
    const giscus = document.querySelector('.giscus');
    if (giscus) {
      giscus.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // 返回顶部
  function backToTop() {
    window.scroll({ top: 0, behavior: "smooth" });
  }

  // 应用保存的排序状态
  function applySavedSort() {
    const currentPath = window.location.pathname;
    const isCurrentHomePage =
      currentPath === "/" || /^\/(\d+|page\/\d+)\/?$/.test(currentPath);
    const isCurrentHotPage = /^\/hot(\/\d+)?\/?$/.test(currentPath);

    if (isCurrentHomePage || isCurrentHotPage) {
      isHomePage = true;
      isHotPage = isCurrentHotPage;
      isPostPage = false;

      if (isCurrentHotPage) {
        // /hot/ 页面默认选中 views
        currentSortIndex = sortModes.findIndex((m) => m.key === "views");
        localStorage.setItem("post-sort-mode", "views");
      } else {
        const savedSort = localStorage.getItem("post-sort-mode") as SortMode | null;
        if (savedSort === "views") {
          // 从 /hot/ 回到首页，重置为 published
          currentSortIndex = 0;
          localStorage.setItem("post-sort-mode", "published");
        } else if (savedSort && savedSort !== "published") {
          const savedIndex = sortModes.findIndex((m) => m.key === savedSort);
          if (savedIndex !== -1) {
            currentSortIndex = savedIndex;
            waitAndSort(savedSort);
          }
        } else {
          currentSortIndex = 0;
        }
      }
    } else {
      isHomePage = false;
      isHotPage = false;
      isPostPage = /^\/posts\//.test(currentPath);
    }
  }

  // 等待条件满足后执行排序
  function waitAndSort(mode: SortMode, retries = 0) {
    const maxRetries = 20; // 最多等待约4秒
    const container = document.querySelector(".post-list-container");

    if (!container || container.children.length === 0) {
      // DOM 未就绪，继续等待
      if (retries < maxRetries) {
        setTimeout(() => waitAndSort(mode, retries + 1), 200);
      }
      return;
    }

    // 对于浏览量排序，需要等待 umamiCache 加载
    if (mode === "views") {
      const cards = container.querySelectorAll('[id^="post-card-"]');
      const hasAnyViewData = Array.from(cards).some((card) => {
        const slug = (card as HTMLElement).dataset.slug;
        return (
          slug && (window as any).umamiCache?.[slug]?.pageViews !== undefined
        );
      });

      if (!hasAnyViewData && retries < maxRetries) {
        // 浏览量数据未加载，继续等待
        setTimeout(() => waitAndSort(mode, retries + 1), 200);
        return;
      }
    }

    // 条件满足，执行排序
    sortPosts(mode);
  }

  onMount(() => {
    // 显示跨页 toast
    const pendingToast = sessionStorage.getItem("sort-toast");
    if (pendingToast) {
      sessionStorage.removeItem("sort-toast");
      showToast(pendingToast);
    }

    // 初始判断并应用排序
    applySavedSort();

    // 监听 Swup 页面切换事件 - 使用多种事件确保触发
    const handleSwupContentReplace = () => {
      // 使用较长延迟确保 DOM 完全加载
      setTimeout(() => {
        applySavedSort();
      }, 300);
    };

    // 尝试注册 Swup 钩子
    const registerSwupHooks = () => {
      if ((window as any).swup?.hooks) {
        (window as any).swup.hooks.on(
          "content:replace",
          handleSwupContentReplace
        );
        (window as any).swup.hooks.on("page:view", handleSwupContentReplace);
      }
    };

    // 立即尝试注册
    registerSwupHooks();

    // 也监听 Swup 启用事件（以防 Swup 尚未初始化）
    document.addEventListener("swup:enable", registerSwupHooks);
    document.addEventListener("swup:contentReplaced", handleSwupContentReplace);

    // 监听滚动显示返回顶部按钮
    const handleScroll = () => {
      showBackToTop = window.scrollY > 300;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // ESC 退出背景模式
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isBackgroundHidden) {
        toggleBackground();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("swup:enable", registerSwupHooks);
      document.removeEventListener(
        "swup:contentReplaced",
        handleSwupContentReplace
      );
      if ((window as any).swup?.hooks) {
        (window as any).swup.hooks.off(
          "content:replace",
          handleSwupContentReplace
        );
        (window as any).swup.hooks.off("page:view", handleSwupContentReplace);
      }
      hideExitHint();
    };
  });
</script>

<div class="floating-controls" class:bg-mode={isBackgroundHidden}>
  <!-- 排序按钮（仅首页） -->
  {#if isHomePage && !isBackgroundHidden}
    <button
      class="control-btn"
      on:click={cycleSortMode}
      aria-label="切换排序方式"
      title={`当前：${sortModes[currentSortIndex].label}（点击切换）`}
    >
      {#if sortModes[currentSortIndex].icon === "calendar"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      {:else if sortModes[currentSortIndex].icon === "edit"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <path d="M15 14l-3.5 3.5L10 16l3.5-3.5L15 14z"></path>
          <line x1="12" y1="11" x2="12" y2="11.01"></line>
        </svg>
      {:else}
        <!-- 火焰图标表示热门/浏览次数 -->
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
          ></path>
        </svg>
      {/if}
    </button>
  {/if}

  <!-- 预览背景按钮 -->
  <button
    class="control-btn"
    class:active={isBackgroundHidden}
    on:click={toggleBackground}
    aria-label={isBackgroundHidden ? "显示内容" : "仅展示背景"}
    title={isBackgroundHidden ? "显示内容" : "仅展示背景 (按ESC退出)"}
  >
    {#if isBackgroundHidden}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    {:else}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
        ></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    {/if}
  </button>

  <!-- 跳转评论区按钮（仅文章页） -->
  {#if isPostPage && !isBackgroundHidden}
    <button
      class="control-btn"
      on:click={scrollToComments}
      aria-label="跳转到评论区"
      title="跳转到评论区"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        <line x1="9" y1="10" x2="9" y2="10"></line>
        <line x1="12" y1="10" x2="12" y2="10"></line>
        <line x1="15" y1="10" x2="15" y2="10"></line>
      </svg>
    </button>
  {/if}

  <!-- 返回顶部按钮 -->
  {#if !isBackgroundHidden}
    <button
      class="control-btn back-to-top"
      class:show={showBackToTop}
      on:click={backToTop}
      aria-label="返回顶部"
      title="返回顶部"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>
    </button>
  {/if}
</div>

<style>
  .floating-controls {
    position: fixed;
    bottom: 6rem;
    right: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    z-index: 9999;
  }

  .floating-controls.bg-mode {
    bottom: auto;
    right: auto;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .control-btn {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 0.75rem;
    background: var(--card-bg);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--line-divider);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: var(--primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .control-btn:hover {
    background: var(--btn-regular-bg-hover);
    transform: scale(1.1);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    border-color: var(--primary);
  }

  .control-btn:active {
    transform: scale(0.95);
  }

  .control-btn.active {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.9);
    animation: pulse 2s ease-in-out infinite;
    width: 4rem;
    height: 4rem;
  }

  .control-btn.active:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: scale(1.1);
  }

  .control-btn.back-to-top {
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px);
  }

  .control-btn.back-to-top.show {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  @keyframes pulse {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4);
    }
    50% {
      box-shadow: 0 0 0 15px rgba(255, 255, 255, 0);
    }
  }

  /* 桌面端 */
  @media (min-width: 1024px) {
    .floating-controls {
      right: 10rem;
      bottom: 6rem;
    }
  }

  /* 移动端 */
  @media (max-width: 767px) {
    .floating-controls {
      right: 1rem;
      bottom: 5rem;
    }
    .control-btn {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 0.625rem;
    }
  }

  /* Toast 样式 */
  :global(.sort-toast) {
    position: fixed;
    top: 5rem;
    left: 50%;
    transform: translateX(-50%) translateY(-20px);
    background: var(--card-bg);
    color: var(--primary);
    padding: 0.75rem 1.5rem;
    border-radius: 2rem;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    border: 1px solid var(--line-divider);
    font-size: 0.9rem;
    font-weight: 600;
    z-index: 10001;
    opacity: 0;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
  }

  :global(.sort-toast.show) {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }

  /* 退出提示样式 */
  :global(.bg-exit-hint) {
    position: fixed;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    pointer-events: none;
    animation: slideDown 0.5s ease-out;
  }

  :global(.bg-exit-hint.fade-out) {
    animation: fadeOut 0.5s ease-out forwards;
  }

  :global(.hint-content) {
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  :global(.hint-icon) {
    font-size: 1.5rem;
    animation: bounce 1s ease-in-out infinite;
  }

  :global(.hint-text) {
    font-size: 0.95rem;
    font-weight: 500;
    white-space: nowrap;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @keyframes fadeOut {
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px);
    }
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }
</style>
