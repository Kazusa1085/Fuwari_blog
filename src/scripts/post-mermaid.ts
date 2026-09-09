declare const mermaid: any;

export function initPostMermaid(prerenderAll: boolean): void {
	// 异步加载 Mermaid，避免阻塞页面渲染
	(() => {
		// 防止重复加载
		if (document.querySelector('script[src*="mermaid"]')) return;
		const script = document.createElement("script");
		script.src =
			"https://fastly.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js";
		script.async = true;
		document.head.appendChild(script);
	})();
	// 使用 IIFE 避免 Swup 重新执行时变量重复声明
	(() => {
		// ===== prerenderAll 模式：预渲染所有内容 =====
		if (prerenderAll) {
			// 1. 禁用图片懒加载
			document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
				img.removeAttribute("loading");
				img.setAttribute("loading", "eager");
			});

			// 2. 临时展开所有 details，强制浏览器渲染代码块、公式等
			const closedDetails: HTMLDetailsElement[] = [];
			document
				.querySelectorAll<HTMLDetailsElement>("details:not([open])")
				.forEach((d) => {
					closedDetails.push(d);
					d.open = true;
				});

			// 3. 等待浏览器完成布局计算后恢复折叠状态
			if (closedDetails.length > 0) {
				// 使用 requestAnimationFrame 确保渲染完成
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						closedDetails.forEach((d) => {
							d.open = false;
						});
					});
				});
			}
		}

		// ===== 资源管理 =====
		(window as any)._postPageResources = (window as any)._postPageResources || {
			observer: null,
			timeoutId: null,
			cleanupRegistered: false,
		};

		const resources = (window as any)._postPageResources;

		// 清理函数
		function cleanupResources() {
			if (resources.observer) {
				resources.observer.disconnect();
				resources.observer = null;
			}
			if (resources.timeoutId) {
				clearTimeout(resources.timeoutId);
				resources.timeoutId = null;
			}
		}

		// 注册清理事件（只注册一次）
		if (!resources.cleanupRegistered) {
			document.addEventListener("swup:willReplaceContent", cleanupResources);
			resources.cleanupRegistered = true;
		}

		// ===== Mermaid 初始化 =====
		function initMermaid() {
			if (typeof mermaid === "undefined") {
				setTimeout(initMermaid, 100);
				return;
			}

			// 仅当 prerenderAll=true 时，临时展开所有 details 预渲染
			const closedDetails: HTMLDetailsElement[] = [];
			if (prerenderAll) {
				document
					.querySelectorAll<HTMLDetailsElement>("details:not([open])")
					.forEach((d) => {
						closedDetails.push(d);
						d.open = true;
					});
			}

			const mermaidBlocks = document.querySelectorAll(
				'pre[data-language="mermaid"]',
			);
			if (mermaidBlocks.length === 0) {
				// 恢复折叠状态
				closedDetails.forEach((d) => {
					d.open = false;
				});
				return;
			}

			const isDarkMode = document.documentElement.classList.contains("dark");
			mermaid.initialize({
				startOnLoad: false,
				theme: isDarkMode ? "dark" : "default",
				securityLevel: "loose",
				fontFamily: "inherit",
			});

			// 串行渲染
			(async () => {
				for (let index = 0; index < mermaidBlocks.length; index++) {
					const preNode = mermaidBlocks[index];
					let code = "";
					const codeLines = preNode.querySelectorAll(".ec-line .code");
					if (codeLines.length > 0) {
						code = Array.from(codeLines)
							.map((line) => line.textContent || "")
							.join("\n")
							.trim();
					} else {
						code = (preNode.textContent || "").trim();
					}

					if (!code) continue;

					let toReplace = preNode;
					const figureParent = preNode.closest("figure.frame");
					if (figureParent) toReplace = figureParent;
					const ecParent = preNode.closest(".expressive-code");
					if (ecParent) toReplace = ecParent;

					const id = `mermaid-${index}-${Date.now()}`;
					const container = document.createElement("div");
					container.id = id;
					container.className = "mermaid";
					container.setAttribute("data-processed", "false");
					container.style.cssText =
						"display:flex;justify-content:center;margin:2rem 0;opacity:0;transition:opacity 0.3s ease";
					container.setAttribute("data-mermaid-src", code);

					toReplace.parentNode?.replaceChild(container, toReplace);

					try {
						const result = await mermaid.render(`${id}-svg`, code);
						container.innerHTML = result.svg;
						container.style.opacity = "1";
					} catch (error) {
						console.error("[Mermaid] Render failed:", error);
						const message =
							error instanceof Error ? error.message : String(error);
						container.innerHTML = `<div style="color:red;padding:1rem;border:1px solid red;border-radius:0.5rem">Mermaid 渲染失败: ${message}</div>`;
						container.style.opacity = "1";
					}
				}

				// 所有 Mermaid 渲染完成后，恢复 details 的折叠状态
				closedDetails.forEach((d) => {
					d.open = false;
				});
			})();
		}

		// 处理 details 标签中 Mermaid 的延迟渲染（仅当 prerenderAll=false 时生效）
		function handleDetailsMermaid() {
			if (prerenderAll) return; // 预渲染模式下不需要

			document
				.querySelectorAll<HTMLDetailsElement>("details")
				.forEach((details) => {
					if (details.dataset.mermaidBound) return;
					details.dataset.mermaidBound = "1";
					details.addEventListener("toggle", () => {
						if (details.open) {
							const unrendered = details.querySelectorAll(
								'pre[data-language="mermaid"]',
							);
							if (unrendered.length > 0) {
								initMermaid();
							}
						}
					});
				});
		}

		// 主题切换监听
		function setupThemeObserver() {
			// 先清理旧的
			cleanupResources();

			const observer = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (
						mutation.attributeName === "class" &&
						mutation.target === document.documentElement
					) {
						// 确保 mermaid 已加载
						if (typeof mermaid === "undefined") return;

						const isDark = document.documentElement.classList.contains("dark");
						mermaid.initialize({ theme: isDark ? "dark" : "default" });

						document
							.querySelectorAll(".mermaid[data-mermaid-src]")
							.forEach(async (container) => {
								const code = container.getAttribute("data-mermaid-src");
								if (code) {
									try {
										const result = await mermaid.render(
											`${container.id}-rerender-${Date.now()}`,
											code,
										);
										container.innerHTML = result.svg;
									} catch (e) {
										console.error("[Mermaid] Re-render failed:", e);
									}
								}
							});
					}
				});
			});
			observer.observe(document.documentElement, { attributes: true });
			resources.observer = observer;
		}

		// 初始化
		initMermaid();
		handleDetailsMermaid();
		setupThemeObserver();

		// Swup 兼容（只注册一次）
		if (!(window as any)._mermaidSwupRegistered) {
			document.addEventListener("swup:contentReplaced", () => {
				initMermaid();
				handleDetailsMermaid();
				setupThemeObserver();
			});
			(window as any)._mermaidSwupRegistered = true;
		}
	})();
}
