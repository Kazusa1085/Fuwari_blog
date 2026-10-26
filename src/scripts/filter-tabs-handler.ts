// Projects page filter tabs. Moved out of public/js so Vite emits a hashed
// asset instead of serving a mutable filename with a one-year cache.
//
// The original version listened to Astro's astro:page-load; Fuwari uses Swup,
// so we re-initialise on swup:contentReplaced as well.

function initFilterTabs(reset?: boolean): void {
	const containers = document.querySelectorAll<HTMLElement>(".filter-tabs");

	containers.forEach((container) => {
		if (!reset && container.dataset.initialized) return;
		container.dataset.initialized = "true";

		const tabs = container.querySelectorAll<HTMLElement>(".filter-tabs-item");
		const filterAttr = tabs[0]?.dataset.filterAttr;
		if (!filterAttr) return;

		const dataSelector = `[data-${filterAttr}]`;
		const parent: HTMLElement =
			(container.closest(".card-base") as HTMLElement | null) ??
			(document as unknown as HTMLElement);
		const items = parent.querySelectorAll<HTMLElement>(dataSelector);
		const noResults = parent.querySelector<HTMLElement>("#no-results");

		if (items.length === 0) return;

		tabs.forEach((tab) => {
			tab.addEventListener("click", () => {
				tabs.forEach((other) => {
					other.classList.remove("active");
				});
				tab.classList.add("active");

				const activeValue = tab.dataset.filterValue || "all";
				let visibleCount = 0;

				items.forEach((item) => {
					const itemValue = item.dataset[filterAttr];
					const match =
						activeValue === "all" ||
						(itemValue !== undefined &&
							itemValue.split(",").indexOf(activeValue) !== -1);

					if (match) {
						item.classList.remove("filtered-out");
						visibleCount += 1;
					} else {
						item.classList.add("filtered-out");
					}
				});

				if (noResults) {
					noResults.classList.toggle("hidden", visibleCount > 0);
				}
			});
		});
	});
}

function onInit(): void {
	if (document.querySelector(".filter-tabs")) {
		initFilterTabs(true);
	}
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", onInit);
} else {
	onInit();
}

document.addEventListener("swup:contentReplaced", onInit);

export {};
