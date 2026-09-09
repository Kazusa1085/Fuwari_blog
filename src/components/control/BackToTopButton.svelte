<script lang="ts">
import { onMount } from "svelte";

let show = false;

function scrollToTop() {
	window.scrollTo({ top: 0, behavior: "smooth" });
}

onMount(() => {
	const handleScroll = () => {
		show = window.scrollY > 300;
	};

	handleScroll();
	window.addEventListener("scroll", handleScroll, { passive: true });
	return () => window.removeEventListener("scroll", handleScroll);
});
</script>

<button
	class="back-to-top-btn"
	class:show
	on:click={scrollToTop}
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

<style>
	.back-to-top-btn {
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
		opacity: 0;
		pointer-events: none;
		transform: translateY(10px);
	}

	.back-to-top-btn.show {
		opacity: 1;
		pointer-events: auto;
		transform: translateY(0);
	}

	.back-to-top-btn:hover {
		background: var(--btn-regular-bg-hover);
		transform: scale(1.1);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
		border-color: var(--primary);
	}

	.back-to-top-btn:active {
		transform: scale(0.95);
	}
</style>
