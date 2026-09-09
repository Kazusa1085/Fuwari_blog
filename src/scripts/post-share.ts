export function initPostShare(): void {
	function setupShareButton() {
		const shareButton = document.getElementById("share-button");
		if (!shareButton) return;

		// Swup 会替换页面内容；避免重复绑定
		if (shareButton.dataset.shareBound === "1") return;
		shareButton.dataset.shareBound = "1";

		const shareText = shareButton.querySelector("#share-text");
		if (!shareText) return;

		const shareTextElement = shareText as HTMLElement;
		const shareButtonElement = shareButton as HTMLElement;

		shareButton.addEventListener("click", () => {
			const url = window.location.href;

			function showSuccess() {
				const originalText = shareTextElement.textContent;
				shareTextElement.textContent = "已复制!";
				shareButtonElement.style.backgroundColor = "var(--primary)";
				shareButtonElement.style.color = "white";

				setTimeout(() => {
					shareTextElement.textContent = originalText || "分享";
					shareButtonElement.style.backgroundColor = "";
					shareButtonElement.style.color = "";
				}, 2000);
			}

			function showFailure() {
				shareTextElement.textContent = "复制失败";
				setTimeout(() => {
					shareTextElement.textContent = "分享";
				}, 2000);
			}

			// Safari 兼容 fallback
			function fallbackCopy(text: string) {
				const textArea = document.createElement("textarea");
				textArea.value = text;

				textArea.style.position = "fixed";
				textArea.style.top = "0";
				textArea.style.left = "0";
				textArea.style.width = "2em";
				textArea.style.height = "2em";
				textArea.style.padding = "0";
				textArea.style.border = "none";
				textArea.style.outline = "none";
				textArea.style.boxShadow = "none";
				textArea.style.background = "transparent";
				textArea.setAttribute("readonly", "");
				textArea.style.opacity = "0";

				document.body.appendChild(textArea);

				const isIOS =
					/iPad|iPhone|iPod/.test(navigator.userAgent) &&
					!(window as any).MSStream;
				if (isIOS) {
					const range = document.createRange();
					range.selectNodeContents(textArea);
					const selection = window.getSelection();
					selection?.removeAllRanges();
					selection?.addRange(range);
					textArea.setSelectionRange(0, 999999);
				} else {
					textArea.select();
				}

				let success = false;
				try {
					success = document.execCommand("copy");
				} catch (err) {
					console.error("[Share] execCommand failed:", err);
				}

				document.body.removeChild(textArea);
				return success;
			}

			if (navigator.clipboard && window.isSecureContext) {
				navigator.clipboard
					.writeText(url)
					.then(() => {
						showSuccess();
					})
					.catch((err) => {
						console.warn("[Share] Clipboard API failed, trying fallback:", err);
						if (fallbackCopy(url)) {
							showSuccess();
						} else {
							showFailure();
						}
					});
			} else {
				if (fallbackCopy(url)) {
					showSuccess();
				} else {
					showFailure();
				}
			}
		});
	}

	// 首次加载
	setupShareButton();

	// Swup 页面跳转后内容会被替换，需要重新绑定
	document.addEventListener("swup:contentReplaced", setupShareButton);
}
