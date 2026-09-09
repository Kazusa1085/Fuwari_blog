export function initMarkdownCopy(): void {
	document.addEventListener("click", (event: MouseEvent) => {
		const target = event.target as Element | null;
		if (!target?.classList.contains("copy-btn")) return;

		const preElement = target.closest("pre");
		const codeElement = preElement?.querySelector("code");
		const code = Array.from(
			codeElement?.querySelectorAll(".code:not(summary *)") ?? [],
		)
			.map((element) => element.textContent)
			.map((text) => (text === "\n" ? "" : text))
			.join("\n");

		navigator.clipboard.writeText(code);

		const timeoutId = target.getAttribute("data-timeout-id");
		if (timeoutId) {
			clearTimeout(Number.parseInt(timeoutId, 10));
		}

		target.classList.add("success");

		const newTimeoutId = setTimeout(() => {
			target.classList.remove("success");
		}, 1000);
		target.setAttribute("data-timeout-id", newTimeoutId.toString());
	});
}
