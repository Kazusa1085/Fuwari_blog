// Projects 页面筛选标签的交互脚本
// 从 Mizuki 主题移植，原版监听 Astro 原生的 astro:page-load 事件；
// Fuwari 用的是 Swup 做页面过渡，所以这里改成监听 swup:contentReplaced，
// 保证从其他页面过渡回 Projects 页时筛选功能能重新初始化。
(function () {
	function initFilterTabs(reset) {
		var containers = document.querySelectorAll(".filter-tabs");

		containers.forEach(function (container) {
			if (!reset && container.dataset.initialized) return;
			container.dataset.initialized = "true";

			var tabs = container.querySelectorAll(".filter-tabs-item");
			var filterAttr = tabs[0] ? tabs[0].dataset.filterAttr : null;
			if (!filterAttr) return;

			var dataSelector = "[data-" + filterAttr + "]";
			var parent = container.closest(".card-base") || document;
			var items = parent.querySelectorAll(dataSelector);
			var noResults = parent.querySelector("#no-results");

			if (items.length === 0) return;

			tabs.forEach(function (tab) {
				tab.addEventListener("click", function () {
					tabs.forEach(function (t) {
						t.classList.remove("active");
					});
					tab.classList.add("active");

					var activeValue = tab.dataset.filterValue || "all";
					var visibleCount = 0;

					items.forEach(function (item) {
						var itemValue = item.dataset[filterAttr];
						var match =
							activeValue === "all" || (itemValue && itemValue.split(",").indexOf(activeValue) !== -1);

						if (match) {
							item.classList.remove("filtered-out");
							visibleCount++;
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

	function onInit() {
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
})();